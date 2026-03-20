/// VERITAS — on-chain provenance registry for AI-generated NFTs stored on Shelby Protocol.
/// Each minted token carries a ProvenanceRecord that links the Aptos Digital Asset token
/// to its permanent Shelby blob via a cryptographic merkle root commitment.
module veritas::nft_registry {
    use std::signer;
    use std::string::{Self, String};
    use std::option;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_token_objects::collection;
    use aptos_token_objects::token::{Self, Token};
    use aptos_token_objects::royalty;

    // ── Error constants ──────────────────────────────────────────────────────

    const E_UNAUTHORIZED:        u64 = 1;
    const E_EMPTY_STRING:        u64 = 2;
    const E_STRING_TOO_LONG:     u64 = 3;
    const E_INVALID_ROYALTY:     u64 = 4;
    const E_INVALID_ACCESS_TYPE: u64 = 5;
    const E_NO_PROVENANCE:       u64 = 6;
    const E_ZERO_PRICE:          u64 = 7;
    const E_ZERO_ADDRESS:        u64 = 8;
    const E_OVERFLOW:            u64 = 9;
    const E_NOT_OWNER:           u64 = 10;

    // ── Configuration constants ──────────────────────────────────────────────

    /// Maximum characters for name/description/model fields
    const MAX_SHORT_STRING: u64 = 256;
    /// Maximum characters for prompt preview stored on-chain
    const MAX_PROMPT_LEN:   u64 = 512;
    /// Maximum royalty basis points (15%)
    const MAX_ROYALTY_BPS:  u64 = 1500;
    /// Token description — stored as bytes to avoid per-call UTF-8 validation
    const TOKEN_DESCRIPTION: vector<u8> = b"AI-generated art with embedded provenance on Shelby Protocol";
    /// Access type: public, free to view
    const ACCESS_PUBLIC:    u8 = 0;
    /// Access type: public, paid per view
    const ACCESS_PAID:      u8 = 1;
    /// Access type: private (owner-only)
    const ACCESS_PRIVATE:   u8 = 2;

    // ── Structs ──────────────────────────────────────────────────────────────

    /// Stored on the token object — links the NFT to its Shelby blob with proof.
    struct ProvenanceRecord has key {
        /// Shelby blob path: "<account_hex>/nfts/<slug>/artwork.<ext>"
        blob_path: String,
        /// SHA-256 merkle root returned by Shelby SDK (hex string, no 0x prefix)
        merkle_root: String,
        /// Merkle root of the metadata.json blob
        metadata_hash: String,
        /// AI model used, e.g. "stable-diffusion-3.5"
        ai_model: String,
        /// Truncated prompt stored on-chain (full prompt in metadata.json on Shelby)
        ai_prompt_preview: String,
        /// Aptos tx hash of the Shelby blob commitment registration
        shelby_tx_hash: String,
        /// Unix timestamp micros when asset was generated
        creation_timestamp: u64,
        /// Royalty in basis points (500 = 5%)
        royalty_bps: u64,
        /// Access control: 0=public free, 1=public paid, 2=private
        access_type: u8,
        /// Price per access in Octas; 0 if free
        price_per_access: u64,
    }

    /// Stored on the token object — tracks view and revenue counters.
    struct AccessCounter has key {
        total_views:   u64,
        total_revenue: u64,
    }

    /// Stored on the creator's account — aggregate creator stats.
    struct CreatorStats has key {
        total_minted:  u64,
        total_revenue: u64,
        total_views:   u64,
    }

    // ── Events ───────────────────────────────────────────────────────────────

    #[event]
    struct NFTMintedEvent has drop, store {
        token_address:    address,
        creator:          address,
        access_type:      u8,
        price_per_access: u64,
        minted_at:        u64,
    }

    #[event]
    struct AccessGrantedEvent has drop, store {
        token_address: address,
        accessor:      address,
        amount_paid:   u64,
        granted_at:    u64,
    }

    #[event]
    struct AccessTypeUpdatedEvent has drop, store {
        token_address:    address,
        owner:            address,
        new_access_type:  u8,
        new_price:        u64,
        updated_at:       u64,
    }

    // ── Entry functions ──────────────────────────────────────────────────────

    /// Create a VERITAS collection. Must be called before minting.
    public entry fun create_collection(
        creator:     &signer,
        name:        String,
        description: String,
        uri:         String,
        max_supply:  u64,
        royalty_bps: u64,
    ) {
        assert!(string::length(&name)        > 0,              E_EMPTY_STRING);
        assert!(string::length(&name)        <= MAX_SHORT_STRING, E_STRING_TOO_LONG);
        assert!(string::length(&description) <= MAX_SHORT_STRING, E_STRING_TOO_LONG);
        assert!(royalty_bps                  <= MAX_ROYALTY_BPS,  E_INVALID_ROYALTY);

        let royalty_obj = royalty::create(royalty_bps, 10000, signer::address_of(creator));
        if (max_supply == 0) {
            collection::create_unlimited_collection(
                creator,
                description,
                name,
                option::some(royalty_obj),
                uri,
            );
        } else {
            collection::create_fixed_collection(
                creator,
                description,
                max_supply,
                name,
                option::some(royalty_obj),
                uri,
            );
        };
    }

    /// Mint an NFT with embedded on-chain provenance record.
    /// Call AFTER Shelby upload is confirmed (you need the merkle_root and shelby_tx_hash).
    public entry fun mint_with_provenance(
        creator:           &signer,
        collection_name:   String,
        token_name:        String,
        token_uri:         String,
        blob_path:         String,
        merkle_root:       String,
        metadata_hash:     String,
        ai_model:          String,
        ai_prompt_preview: String,
        shelby_tx_hash:    String,
        royalty_bps:       u64,
        access_type:       u8,
        price_per_access:  u64,
    ) {
        // Input validation
        assert!(string::length(&token_name)        > 0,               E_EMPTY_STRING);
        assert!(string::length(&token_name)        <= MAX_SHORT_STRING, E_STRING_TOO_LONG);
        assert!(string::length(&blob_path)         > 0,               E_EMPTY_STRING);
        assert!(string::length(&merkle_root)       > 0,               E_EMPTY_STRING);
        assert!(string::length(&ai_model)          > 0,               E_EMPTY_STRING);
        assert!(string::length(&ai_prompt_preview) <= MAX_PROMPT_LEN, E_STRING_TOO_LONG);
        assert!(royalty_bps <= MAX_ROYALTY_BPS, E_INVALID_ROYALTY);
        assert!(
            access_type == ACCESS_PUBLIC || access_type == ACCESS_PAID || access_type == ACCESS_PRIVATE,
            E_INVALID_ACCESS_TYPE,
        );
        if (access_type == ACCESS_PAID) {
            assert!(price_per_access > 0, E_ZERO_PRICE);
        };

        // Auto-create the collection for this creator if it doesn't exist yet.
        // Collection object address is derived from (creator_addr, collection_name),
        // so each user gets their own personal VERITAS collection.
        let collection_obj_addr = collection::create_collection_address(
            &signer::address_of(creator),
            &collection_name,
        );
        if (!object::object_exists<collection::Collection>(collection_obj_addr)) {
            collection::create_unlimited_collection(
                creator,
                string::utf8(TOKEN_DESCRIPTION),
                collection_name,
                option::none(),
                string::utf8(b""),
            );
        };

        // Mint the Aptos Digital Asset token
        let constructor_ref = token::create_named_token(
            creator,
            collection_name,
            string::utf8(TOKEN_DESCRIPTION),
            token_name,
            option::none(),
            token_uri,
        );

        let token_signer = object::generate_signer(&constructor_ref);
        let creator_addr = signer::address_of(creator);
        let now = timestamp::now_microseconds();

        // Attach provenance record to token object
        move_to(&token_signer, ProvenanceRecord {
            blob_path,
            merkle_root,
            metadata_hash,
            ai_model,
            ai_prompt_preview,
            shelby_tx_hash,
            creation_timestamp: now,
            royalty_bps,
            access_type,
            price_per_access,
        });

        // Attach access counter
        move_to(&token_signer, AccessCounter {
            total_views:   0,
            total_revenue: 0,
        });

        // Init or update creator stats
        if (!exists<CreatorStats>(creator_addr)) {
            move_to(creator, CreatorStats {
                total_minted:  1,
                total_revenue: 0,
                total_views:   0,
            });
        } else {
            let stats = borrow_global_mut<CreatorStats>(creator_addr);
            assert!(stats.total_minted <= 18446744073709551614, E_OVERFLOW);
            stats.total_minted = stats.total_minted + 1;
        };

        let token_address = object::address_from_constructor_ref(&constructor_ref);

        event::emit(NFTMintedEvent {
            token_address,
            creator: creator_addr,
            access_type,
            price_per_access,
            minted_at: now,
        });
    }

    /// Pay to access a paid NFT's blob. Transfers APT from accessor to creator.
    public entry fun request_access(
        accessor:      &signer,
        token_obj:     Object<Token>,
    ) acquires ProvenanceRecord, AccessCounter, CreatorStats {
        let token_address = object::object_address(&token_obj);
        assert!(exists<ProvenanceRecord>(token_address), E_NO_PROVENANCE);

        let provenance = borrow_global<ProvenanceRecord>(token_address);
        // Cache owner once — used for payment routing, private-access check, and stats update
        let creator = object::owner(token_obj);
        // Free access — just log the view
        let amount_paid = if (provenance.access_type == ACCESS_PUBLIC) {
            0u64
        } else if (provenance.access_type == ACCESS_PAID) {
            let price = provenance.price_per_access;
            coin::transfer<AptosCoin>(accessor, creator, price);
            price
        } else {
            // Private: only owner can access
            assert!(
                creator == signer::address_of(accessor),
                E_UNAUTHORIZED,
            );
            0u64
        };

        // Increment access counter
        let counter = borrow_global_mut<AccessCounter>(token_address);
        assert!(counter.total_views <= 18446744073709551614, E_OVERFLOW);
        counter.total_views   = counter.total_views + 1;
        counter.total_revenue = counter.total_revenue + amount_paid;

        // Update creator aggregate stats
        if (exists<CreatorStats>(creator)) {
            let stats = borrow_global_mut<CreatorStats>(creator);
            stats.total_views   = stats.total_views + 1;
            stats.total_revenue = stats.total_revenue + amount_paid;
        };

        event::emit(AccessGrantedEvent {
            token_address,
            accessor: signer::address_of(accessor),
            amount_paid,
            granted_at: timestamp::now_microseconds(),
        });
    }

    /// Update access type and/or price. Only token owner can call.
    public entry fun update_access(
        owner:           &signer,
        token_obj:       Object<Token>,
        new_access_type: u8,
        new_price:       u64,
    ) acquires ProvenanceRecord {
        assert!(
            object::owner(token_obj) == signer::address_of(owner),
            E_NOT_OWNER,
        );
        assert!(
            new_access_type == ACCESS_PUBLIC ||
            new_access_type == ACCESS_PAID   ||
            new_access_type == ACCESS_PRIVATE,
            E_INVALID_ACCESS_TYPE,
        );
        if (new_access_type == ACCESS_PAID) {
            assert!(new_price > 0, E_ZERO_PRICE);
        };

        let token_address = object::object_address(&token_obj);
        let record = borrow_global_mut<ProvenanceRecord>(token_address);
        record.access_type      = new_access_type;
        record.price_per_access = new_price;

        event::emit(AccessTypeUpdatedEvent {
            token_address,
            owner: signer::address_of(owner),
            new_access_type,
            new_price,
            updated_at: timestamp::now_microseconds(),
        });
    }

    // ── View functions ───────────────────────────────────────────────────────

    #[view]
    /// Returns (blob_path, merkle_root, metadata_hash, ai_model, ai_prompt_preview,
    ///          shelby_tx_hash, creation_timestamp, royalty_bps, access_type, price_per_access)
    public fun get_provenance(token_address: address): (
        String, String, String, String, String, String, u64, u64, u8, u64
    ) acquires ProvenanceRecord {
        assert!(exists<ProvenanceRecord>(token_address), E_NO_PROVENANCE);
        let r = borrow_global<ProvenanceRecord>(token_address);
        (
            r.blob_path,
            r.merkle_root,
            r.metadata_hash,
            r.ai_model,
            r.ai_prompt_preview,
            r.shelby_tx_hash,
            r.creation_timestamp,
            r.royalty_bps,
            r.access_type,
            r.price_per_access,
        )
    }

    #[view]
    /// Verify that a claimed merkle root matches the stored on-chain record.
    public fun verify_provenance(
        token_address:       address,
        claimed_merkle_root: String,
    ): bool acquires ProvenanceRecord {
        if (!exists<ProvenanceRecord>(token_address)) { return false };
        let r = borrow_global<ProvenanceRecord>(token_address);
        r.merkle_root == claimed_merkle_root
    }

    #[view]
    /// Returns (total_views, total_revenue) for a specific token.
    public fun get_access_stats(token_address: address): (u64, u64) acquires AccessCounter {
        if (!exists<AccessCounter>(token_address)) { return (0, 0) };
        let c = borrow_global<AccessCounter>(token_address);
        (c.total_views, c.total_revenue)
    }

    #[view]
    /// Returns (total_minted, total_revenue, total_views) for a creator address.
    public fun get_creator_stats(creator: address): (u64, u64, u64) acquires CreatorStats {
        if (!exists<CreatorStats>(creator)) { return (0, 0, 0) };
        let s = borrow_global<CreatorStats>(creator);
        (s.total_minted, s.total_revenue, s.total_views)
    }

    #[view]
    /// Check whether a provenance record exists for this token.
    public fun has_provenance(token_address: address): bool {
        exists<ProvenanceRecord>(token_address)
    }

    #[view]
    /// Returns (access_type, price_per_access) for a token.
    public fun get_access_config(token_address: address): (u8, u64) acquires ProvenanceRecord {
        assert!(exists<ProvenanceRecord>(token_address), E_NO_PROVENANCE);
        let r = borrow_global<ProvenanceRecord>(token_address);
        (r.access_type, r.price_per_access)
    }
}
