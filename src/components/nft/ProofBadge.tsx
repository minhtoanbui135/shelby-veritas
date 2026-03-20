import { ShieldCheck, ShieldX, Shield, ShieldAlert } from "lucide-react";

interface ProofBadgeProps {
  status: "verified" | "unverified" | "pending" | "partial";
}

export function ProofBadge({ status }: ProofBadgeProps) {
  if (status === "verified") {
    return (
      <span className="proof-badge">
        <ShieldCheck size={10} />
        Verified
      </span>
    );
  }
  if (status === "unverified") {
    return (
      <span className="proof-badge unverified">
        <ShieldX size={10} />
        Unverified
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="proof-badge partial">
        <ShieldAlert size={10} />
        Partial Provenance
      </span>
    );
  }
  return (
    <span className="proof-badge" style={{ opacity: 0.5 }}>
      <Shield size={10} />
      Pending
    </span>
  );
}
