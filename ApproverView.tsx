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
  
  // Additional file types
  const [isCibrcUploaded, setIsCibrcUploaded] = useState<boolean>(false);
  const [cibrcFileUrl, setCibrcFileUrl] = useState<string>("");
  const [cibrcStatus, setCibrcStatus] = useState<string | null>(null);
  const [isEngineeringDrawingUploaded, setIsEngineeringDrawingUploaded] = useState<boolean>(false);
  const [engineeringDrawingFileUrl, setEngineeringDrawingFileUrl] = useState<string>("");
  const [engineeringDrawingStatus, setEngineeringDrawingStatus] = useState<string | null>(null);
  const [isSpecificationUploaded, setIsSpecificationUploaded] = useState<boolean>(false);
  const [specificationFileUrl, setSpecificationFileUrl] = useState<string>("");
  const [specificationStatus, setSpecificationStatus] = useState<string | null>(null);
  const [isCdrUploaded, setIsCdrUploaded] = useState<boolean>(false);
  const [cdrFileUrl, setCdrFileUrl] = useState<string>("");
  const [cdrStatus, setCdrStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileStatus = async (): Promise<void> => {
        try {
            setLoading(true);

            // Helper function to safely fetch files from a folder
            const safeFetchFiles = async (folderPath: string) => {
                try {
                    return await sp.web
                        .getFolderByServerRelativeUrl(folderPath)
                        .files.select("Name", "ServerRelativeUrl", "ListItemAllFields/DocID", "ListItemAllFields/Status")
                        .expand("ListItemAllFields")
                        .filter(`ListItemAllFields/DocID eq ${productId}`)
                        .get();
                } catch (error) {
                    console.warn(`Could not fetch files from ${folderPath}:`, error);
                    return [];
                }
            };

            // Fetch from Final Artwork folder
            const finalArtworkFiles = await safeFetchFiles("ArtworkLibrary/PackagingArtwork");
            setFinalArtworkStatus(finalArtworkFiles.length > 0 ? (finalArtworkFiles[0] as any).ListItemAllFields.Status : null);
            setIsFinalArtworkUploaded(finalArtworkFiles.length > 0);
            setFinalArtworkFileUrl(finalArtworkFiles.length > 0 ? finalArtworkFiles[0].ServerRelativeUrl : "");

            // Fetch from FAICA folder
            const faicaFiles = await safeFetchFiles("ArtworkLibrary/FAICA");
            setFaciaStatus(faicaFiles.length > 0 ? (faicaFiles[0] as any).ListItemAllFields.Status : null);
            setIsFaciaUploaded(faicaFiles.length > 0);
            setFaciaFileUrl(faicaFiles.length > 0 ? faicaFiles[0].ServerRelativeUrl : "");

            // Fetch from MOP folder
            const mopFiles = await safeFetchFiles("ArtworkLibrary/MOP");
            setMopStatus(mopFiles.length > 0 ? (mopFiles[0] as any).ListItemAllFields.Status : null);
            setIsMopUploaded(mopFiles.length > 0);
            setMopFileUrl(mopFiles.length > 0 ? mopFiles[0].ServerRelativeUrl : "");

            // Fetch from CIBRC Files folder
            const cibrcFiles = await safeFetchFiles("ArtworkLibrary/CIBRC Files");
            setCibrcStatus(cibrcFiles.length > 0 ? (cibrcFiles[0] as any).ListItemAllFields.Status : null);
            setIsCibrcUploaded(cibrcFiles.length > 0);
            setCibrcFileUrl(cibrcFiles.length > 0 ? cibrcFiles[0].ServerRelativeUrl : "");

            // Fetch from Engineering Drawing folder
            const engineeringDrawingFiles = await safeFetchFiles("ArtworkLibrary/EngineeringDrawing");
            setEngineeringDrawingStatus(engineeringDrawingFiles.length > 0 ? (engineeringDrawingFiles[0] as any).ListItemAllFields.Status : null);
            setIsEngineeringDrawingUploaded(engineeringDrawingFiles.length > 0);
            setEngineeringDrawingFileUrl(engineeringDrawingFiles.length > 0 ? engineeringDrawingFiles[0].ServerRelativeUrl : "");

            // Fetch from Specification folder
            const specificationFiles = await safeFetchFiles("ArtworkLibrary/Specification");
            setSpecificationStatus(specificationFiles.length > 0 ? (specificationFiles[0] as any).ListItemAllFields.Status : null);
            setIsSpecificationUploaded(specificationFiles.length > 0);
            setSpecificationFileUrl(specificationFiles.length > 0 ? specificationFiles[0].ServerRelativeUrl : "");

            // Fetch from CDR folder
            const cdrFiles = await safeFetchFiles("ArtworkLibrary/CDR");
            setCdrStatus(cdrFiles.length > 0 ? (cdrFiles[0] as any).ListItemAllFields.Status : null);
            setIsCdrUploaded(cdrFiles.length > 0);
            setCdrFileUrl(cdrFiles.length > 0 ? cdrFiles[0].ServerRelativeUrl : "");
        } catch (error) {
            console.error("Error fetching file status:", error);
            // If there's an error fetching files, it might be because folders don't exist yet
            // This is normal and expected, so we just log it and continue
        } finally {
            setLoading(false);
        }
    };

    fetchFileStatus().catch((error) => console.error("Error in fetchFileStatus:", error));
  }, [productId, visible]); // Removed unnecessary dependencies

  const handleApproval = async (type: "Facia" | "MOP" | "FinalArtwork" | "CIBRC" | "EngineeringDrawing" | "Specification" | "CDR", decision: "Approved" | "Rejected"): Promise<void> => {
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
      } else if (type === "CIBRC") {
        metadata.CibrcApprovalStatus = decision;
        metadata.CibrcApprovedBy = currentUser.Title;
        metadata.Status = decision === "Approved" ? "CIBRC File Approved" : "CIBRC File Rejected";
        metadata.RunWF = "Yes"; // Set RunWF to Yes
      } else if (type === "EngineeringDrawing") {
        metadata.EngineeringDrawingApprovalStatus = decision;
        metadata.EngineeringDrawingApprovedBy = currentUser.Title;
        metadata.Status = decision === "Approved" ? "Engineering Drawing File Approved" : "Engineering Drawing File Rejected";
        metadata.RunWF = "Yes"; // Set RunWF to Yes
      } else if (type === "Specification") {
        metadata.SpecificationApprovalStatus = decision;
        metadata.SpecificationApprovedBy = currentUser.Title;
        metadata.Status = decision === "Approved" ? "Specification File Approved" : "Specification File Rejected";
        metadata.RunWF = "Yes"; // Set RunWF to Yes
      } else if (type === "CDR") {
        metadata.CdrApprovalStatus = decision;
        metadata.CdrApprovedBy = currentUser.Title;
        metadata.Status = decision === "Approved" ? "CDR File Approved" : "CDR File Rejected";
        metadata.RunWF = "Yes"; // Set RunWF to Yes
      }

      const listName = "Operational - Artwork Management Systems";
      await sp.web.lists.getByTitle(listName).items.getById(productId).update(metadata);

      // Update file status in the respective library
      let folderPath = "";
      if (type === "FinalArtwork") {
        folderPath = "ArtworkLibrary/PackagingArtwork";
      } else if (type === "Facia") {
        folderPath = "ArtworkLibrary/FAICA";
      } else if (type === "MOP") {
        folderPath = "ArtworkLibrary/MOP";
      } else if (type === "CIBRC") {
        folderPath = "ArtworkLibrary/CIBRC Files";
      } else if (type === "EngineeringDrawing") {
        folderPath = "ArtworkLibrary/EngineeringDrawing";
      } else if (type === "Specification") {
        folderPath = "ArtworkLibrary/Specification";
      } else if (type === "CDR") {
        folderPath = "ArtworkLibrary/CDR";
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

          {/* CIBRC Files Approval Section */}
          {isCibrcUploaded && cibrcStatus !== "Approved" && (
            <div style={{ marginBottom: "16px" }}>
              <h3>CIBRC File</h3>
              <a href={cibrcFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
              <div style={{ marginTop: "16px" }}>
                <Button
                  type="primary"
                  onClick={() => handleApproval("CIBRC", "Approved")}
                  style={{ marginRight: "8px" }}
                >
                  Approve
                </Button>
                <Button
                  type="danger"
                  onClick={() => handleApproval("CIBRC", "Rejected")}
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

          {/* Engineering Drawing Approval Section */}
          {isEngineeringDrawingUploaded && engineeringDrawingStatus !== "Approved" && (
            <div style={{ marginBottom: "16px" }}>
              <h3>Engineering Drawing File</h3>
              <a href={engineeringDrawingFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
              <div style={{ marginTop: "16px" }}>
                <Button
                  type="primary"
                  onClick={() => handleApproval("EngineeringDrawing", "Approved")}
                  style={{ marginRight: "8px" }}
                >
                  Approve
                </Button>
                <Button
                  type="danger"
                  onClick={() => handleApproval("EngineeringDrawing", "Rejected")}
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

          {/* Specification Approval Section */}
          {isSpecificationUploaded && specificationStatus !== "Approved" && (
            <div style={{ marginBottom: "16px" }}>
              <h3>Specification File</h3>
              <a href={specificationFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
              <div style={{ marginTop: "16px" }}>
                <Button
                  type="primary"
                  onClick={() => handleApproval("Specification", "Approved")}
                  style={{ marginRight: "8px" }}
                >
                  Approve
                </Button>
                <Button
                  type="danger"
                  onClick={() => handleApproval("Specification", "Rejected")}
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

          {/* CDR Approval Section */}
          {isCdrUploaded && cdrStatus !== "Approved" && (
            <div style={{ marginBottom: "16px" }}>
              <h3>CDR File</h3>
              <a href={cdrFileUrl} target="_blank" rel="noopener noreferrer">
                View File
              </a>
              <div style={{ marginTop: "16px" }}>
                <Button
                  type="primary"
                  onClick={() => handleApproval("CDR", "Approved")}
                  style={{ marginRight: "8px" }}
                >
                  Approve
                </Button>
                <Button
                  type="danger"
                  onClick={() => handleApproval("CDR", "Rejected")}
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

          {/* Show status of all file types */}
          {!isFaciaUploaded && !isMopUploaded && !isFinalArtworkUploaded && !isCibrcUploaded && !isEngineeringDrawingUploaded && !isSpecificationUploaded && !isCdrUploaded && (
            <div>
              <p>No files are currently uploaded and available for approval.</p>
              <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                <h4>Expected File Types:</h4>
                <ul style={{ marginBottom: 0 }}>
                  <li>CIBRC Files</li>
                  <li>FAICA Files</li>
                  <li>MOP Files</li>
                  <li>Final Artwork Files</li>
                  <li>Engineering Drawing Files</li>
                  <li>Specification Files</li>
                  <li>CDR Files</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ApproverView;
