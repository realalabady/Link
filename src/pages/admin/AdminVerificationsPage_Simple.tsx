import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface Verification {
  id: string;
  providerId: string;
  providerName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: Date;
  rejectionReason?: string;
}

const AdminVerificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] =
    useState<Verification | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(
    null,
  );

  // Fetch verification requests
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setLoading(true);
        const verificationsRef = collection(db, "verifications");
        const q = query(verificationsRef, orderBy("requestedAt", "desc"));
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            providerId: docData.providerId,
            providerName: docData.providerName || "Unknown",
            status: docData.status || "PENDING",
            requestedAt: docData.requestedAt?.toDate() || new Date(),
            rejectionReason: docData.rejectionReason,
          };
        });
        setVerifications(data);
      } catch (error) {
        console.error("Error fetching verifications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "ADMIN") {
      fetchVerifications();
    }
  }, [user]);

  const handleApprove = async () => {
    if (!selectedVerification) return;
    setActionLoading(true);
    try {
      const verificationRef = doc(db, "verifications", selectedVerification.id);
      await updateDoc(verificationRef, {
        status: "APPROVED",
        approvedAt: new Date(),
      });

      // Also update provider's isVerified flag
      const providerRef = doc(db, "providers", selectedVerification.providerId);
      await updateDoc(providerRef, {
        isVerified: true,
      });

      // Update local state
      setVerifications((prev) =>
        prev.map((v) =>
          v.id === selectedVerification.id ? { ...v, status: "APPROVED" } : v,
        ),
      );

      setActionDialogOpen(false);
      setSelectedVerification(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error approving verification:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      const verificationRef = doc(db, "verifications", selectedVerification.id);
      await updateDoc(verificationRef, {
        status: "REJECTED",
        rejectionReason: rejectionReason,
        rejectedAt: new Date(),
      });

      // Update local state
      setVerifications((prev) =>
        prev.map((v) =>
          v.id === selectedVerification.id
            ? { ...v, status: "REJECTED", rejectionReason: rejectionReason }
            : v,
        ),
      );

      setActionDialogOpen(false);
      setSelectedVerification(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting verification:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingVerifications = verifications.filter(
    (v) => v.status === "PENDING",
  );
  const approvedVerifications = verifications.filter(
    (v) => v.status === "APPROVED",
  );
  const rejectedVerifications = verifications.filter(
    (v) => v.status === "REJECTED",
  );

  const renderTable = (data: Verification[]) => (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider ID</TableHead>
            <TableHead>Provider Name</TableHead>
            <TableHead>Requested At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No verifications
              </TableCell>
            </TableRow>
          ) : (
            data.map((verification) => (
              <TableRow key={verification.id}>
                <TableCell className="font-mono text-sm">
                  {verification.providerId.slice(0, 8)}...
                </TableCell>
                <TableCell>{verification.providerName}</TableCell>
                <TableCell>
                  {verification.requestedAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      verification.status === "PENDING"
                        ? "outline"
                        : verification.status === "APPROVED"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {verification.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {verification.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVerification(verification);
                        setActionType(null);
                        setActionDialogOpen(true);
                      }}
                    >
                      Review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Provider Verifications
            </h1>
            <p className="text-muted-foreground">
              Review and approve provider verification requests
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending */}
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Pending ({pendingVerifications.length})
                </h2>
                {renderTable(pendingVerifications)}
              </div>

              {/* Approved */}
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Approved ({approvedVerifications.length})
                </h2>
                {renderTable(approvedVerifications)}
              </div>

              {/* Rejected */}
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Rejected ({rejectedVerifications.length})
                </h2>
                {renderTable(rejectedVerifications)}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>
              Provider ID: {selectedVerification?.providerId.slice(0, 12)}...
            </DialogDescription>
          </DialogHeader>

          {actionType === "REJECT" ? (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you're rejecting this verification..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          ) : (
            <div className="py-4 text-sm text-muted-foreground">
              Are you sure you want to approve this verification? The provider
              will be marked as verified.
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setActionType(null);
                setRejectionReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>

            {actionType === null ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setActionType("REJECT")}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => setActionType("APPROVE")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setActionType(null)}
                  disabled={actionLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={
                    actionType === "APPROVE" ? handleApprove : handleReject
                  }
                  disabled={
                    actionLoading ||
                    (actionType === "REJECT" && !rejectionReason.trim())
                  }
                  className={
                    actionType === "APPROVE"
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  {actionLoading && (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {actionType === "APPROVE" ? "Approve" : "Reject"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerificationsPage;
