/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"; 
import { useEffect, useState } from "react";
import { Input, Modal, Button, notification, Spin } from "antd";
import { sp } from "@pnp/sp/presets/all";

interface ApproverViewProps {
  productId: number;
  currentUserRole: "CEO" | "MarketingHead";
  visible: boolean;
  onClose: () => void;
}

const ApproverView: React.FC<ApproverViewProps> = ({ productId, currentUserRole, visible, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isFaciaUploaded, setIsFaciaUploaded] = useState<boolean>(false);
  const [isMopUploaded, setIsMopUploaded] = useState<boolean>(false);
  const [faciaFileUrl, setFaciaFileUrl] = useState<string>("");
  const [mopFileUrl, setMopFileUrl] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [faciaStatus, setFaciaStatus] = useState<string | null>(null);
  const [mopStatus, setMopStatus] = useState<string | null>(null);
  const [isFinalArtworkUploaded, setIsFinalArtworkUploaded] = useState<boolean>(false);
  const [finalArtworkFileUrl, setFinalArtworkFileUrl] = useState<string>("");
  const [finalArtworkStatus, setFinalArtworkStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileStatus = async (): Promise<void> => {
        try {
            setLoading(true);

            // Fetch from Final Artwork folder
            const finalArtworkFiles = await sp.web
                .getFolderByServerRelativeUrl("ArtworkLibrary/PackagingArtwork")
                .files.select("Name", "ServerRelativeUrl", "ListItemAllFields/DocID", "ListItemAllFields/Status")
                .expand("ListItemAllFields")
                .filter(`ListItemAllFields/DocID eq ${productId}`)
                .get();

            setFinalArtworkStatus(finalArtworkFiles.length > 0 ? (finalArtworkFiles[0] as any).ListItemAllFields.Status : null);
            setIsFinalArtworkUploaded(finalArtworkFiles.length > 0);
            setFinalArtworkFileUrl(finalArtworkFiles.length > 0 ? finalArtworkFiles[0].ServerRelativeUrl : "");

            // Fetch from FAICA folder
            const faicaFiles = await sp.web
                .getFolderByServerRelativeUrl("ArtworkLibrary/FAICA")
                .files.select("Name", "ServerRelativeUrl", "ListItemAllFields/DocID", "ListItemAllFields/Status")
                .expand("ListItemAllFields")
                .filter(`ListItemAllFields/DocID eq ${productId}`)
                .get();

            setFaciaStatus(faicaFiles.length > 0 ? (faicaFiles[0] as any).ListItemAllFields.Status : null);
            setIsFaciaUploaded(faicaFiles.length > 0);
            setFaciaFileUrl(faicaFiles.length > 0 ? faicaFiles[0].ServerRelativeUrl : "");

            // Fetch from MOP folder
            const mopFiles = await sp.web
                .getFolderByServerRelativeUrl("ArtworkLibrary/MOP")
                .files.select("Name", "ServerRelativeUrl", "ListItemAllFields/DocID", "ListItemAllFields/Status")
                .expand("ListItemAllFields")
                .filter(`ListItemAllFields/DocID eq ${productId}`)
                .get();

            setMopStatus(mopFiles.length > 0 ? (mopFiles[0] as any).ListItemAllFields.Status : null);
            setIsMopUploaded(mopFiles.length > 0);
            setMopFileUrl(mopFiles.length > 0 ? mopFiles[0].ServerRelativeUrl : "");
        } catch (error) {
            console.error("Error fetching file status:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchFileStatus().catch((error) => console.error("Error in fetchFileStatus:", error));
  }, [productId, visible]); // Removed unnecessary dependencies

  const handleApproval = async (type: "Facia" | "MOP" | "FinalArtwork", decision: "Approved" | "Rejected"): Promise<void> => {
    try {
      const metadata: any = {};
      const currentUser = await sp.web.currentUser.get();

      if (type === "FinalArtwork") {
        metadata.FinalArtworkApprovalStatus = decision;
        metadata.FinalArtworkApprovedBy = currentUser.Title;
        metadata.Status = decision === "Approved" ? "Final Packaging Artwork File Approved" : "Final Packaging Artwork File Rejected";
        metadata.RunWF = "Yes"; // Set RunWF to Yes
      } else if (type === "Facia") {
        metadata.FaciaApprovalStatus = decision;
        metadata.FaciaApprovedBy = currentUser.Title;
        metadata.Status = decision === "Approved" ? "FAICA File Approved" : "FAICA File Rejected";
        metadata.RunWF = "Yes"; // Set RunWF to Yes
      } else if (type === "MOP") {
        metadata.MopApprovalStatus = decision;
        metadata.MopApprovedBy = currentUser.Title;
        metadata.Status = decision === "Approved" ? "MOP File Approved" : "MOP File Rejected";
        metadata.RunWF = "Yes"; // Set RunWF to Yes
        if (decision === "Approved") {
          metadata.CurrentStage = 4; // Only increase stage if MOP is approved
        }
      }

      const listName = "Operational - Artwork Management Systems";
      await sp.web.lists.getByTitle(listName).items.getById(productId).update(metadata);

      // Update file status in the respective library
      let folderPath = "";
      if (type === "FinalArtwork") {
        folderPath = "ArtworkLibrary/FinalArtwork";
      } else if (type === "Facia") {
        folderPath = "ArtworkLibrary/FAICA";
      } else if (type === "MOP") {
        folderPath = "ArtworkLibrary/MOP";
      }
      const files = await sp.web
        .getFolderByServerRelativeUrl(folderPath)
        .files.select("UniqueId", "ListItemAllFields/DocID")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${productId}`)
        .get();

      if (files.length > 0) {
        const fileItem = await sp.web.getFileById(files[0].UniqueId).getItem();
        const updateObj: any = { Status: decision };
        if (decision === "Rejected") {
          updateObj.Remark = remark;
        }
        await fileItem.update(updateObj);
      }

      notification.success({
        message: "Success",
        description: `${type} file has been ${decision.toLowerCase()} successfully.`,
      });
      setRemark("");
      onClose(); // Close the modal after approval/rejection
    } catch (error) {
      console.error(`Error ${decision.toLowerCase()} ${type} file:`, error);
      notification.error({
        message: "Error",
        description: `Failed to ${decision.toLowerCase()} ${type} file. Please try again.`,
      });
    }
  };

  return (
    <Modal
      title="Approval Panel"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {loading ? (
        <Spin size="large" />
      ) : (
        <div>
          {/* Final Artwork Approval Section */}
          {isFinalArtworkUploaded && finalArtworkStatus !== "Approved" && (
            <div style={{ marginBottom: "16px" }}>
              <h3>Final Artwork File</h3>
              <a href={finalArtworkFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
              <div style={{ marginTop: "16px" }}>
                <Button
                  type="primary"
                  onClick={() => handleApproval("FinalArtwork", "Approved")}
                  style={{ marginRight: "8px" }}
                >
                  Approve
                </Button>
                <Button
                  type="danger"
                  onClick={() => handleApproval("FinalArtwork", "Rejected")}
                  style={{ marginRight: "8px" }}
                >
                  Reject
                </Button>
                <Input
                  placeholder="Enter remark (required if rejected)"
                  value={remark}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemark(e.target.value)}
                  style={{ marginTop: 8, width: 300 }}
                />
              </div>
            </div>
          )}

          {/* Existing FAICA and MOP Approval Sections */}
          {isFaciaUploaded && faciaStatus !== "Approved" && (
            <div style={{ marginBottom: "16px" }}>
              <h3>Facia File</h3>
              <a href={faciaFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
              <div style={{ marginTop: "16px" }}>
                <Button
                  type="primary"
                  onClick={() => handleApproval("Facia", "Approved")}
                  style={{ marginRight: "8px" }}
                >
                  Approve
                </Button>
                <Button
                  type="danger"
                  onClick={() => handleApproval("Facia", "Rejected")}
                  style={{ marginRight: "8px" }}
                >
                  Reject
                </Button>
                <Input
                  placeholder="Enter remark (required if rejected)"
                  value={remark}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemark(e.target.value)}
                  style={{ marginTop: 8, width: 300 }}
                />
              </div>
            </div>
          )}

          {isMopUploaded && mopStatus !== "Approved" && (
            <div style={{ marginBottom: "16px" }}>
              <h3>MOP File</h3>
              <a href={mopFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
              <div style={{ marginTop: "16px" }}>
                <Button
                  type="primary"
                  onClick={() => handleApproval("MOP", "Approved")}
                  style={{ marginRight: "8px" }}
                >
                  Approve
                </Button>
                <Button
                  type="danger"
                  onClick={() => handleApproval("MOP", "Rejected")}
                  style={{ marginRight: "8px" }}
                >
                  Reject
                </Button>
                <Input
                  placeholder="Enter remark (required if rejected)"
                  value={remark}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemark(e.target.value)}
                  style={{ marginTop: 8, width: 300 }}
                />
              </div>
            </div>
          )}

          {!isFaciaUploaded && !isMopUploaded && !isFinalArtworkUploaded && <p>No files available for approval.</p>}
        </div>
      )}
    </Modal>
  );
};

export default ApproverView;
