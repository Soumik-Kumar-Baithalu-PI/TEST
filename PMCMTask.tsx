/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import {
  Form,
  Row,
  Col,
  Input,
  Upload,
  Button,
  notification,
  Spin,
  Table,
} from "antd";
import {
  DownloadOutlined,
  FileOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { uploadFileToSharePoint } from "../../Services/SharepointListServies";
import { sp } from "@pnp/sp/presets/all";
import { globalVariables } from "../../Utils/globalVariable";
import { useState, useEffect } from "react";
import styles from "../PMCMTask/PMCMTask.module.scss";

interface PMCMTaskProps {
  currentStage: number;
  isOwner: boolean;
  isFaciaAvailable: boolean;
  isMopAvailable: boolean;
  productId: number | undefined;
  initialFGCode?: string;
  initialBOM?: string;
  initialBrandName?: string;
  initialMOP?: string;
  visible?: boolean;
}

const PMCMTask: React.FC<PMCMTaskProps> = ({
  currentStage,
  isOwner,
  isFaciaAvailable,
  isMopAvailable,
  productId,
  initialFGCode,
  initialBOM,
  initialBrandName,
  visible,
}) => {
  const [form] = Form.useForm();
  const [faciaStatus, setFaciaStatus] = useState<
    "Approved" | "Rejected" | "Pending" | null
  >(null);
  const [mopStatus, setMopStatus] = useState<
    "Approved" | "Rejected" | "Pending" | null
  >(null);
  const [faciaRemark, setFaciaRemark] = useState<string>("");
  const [mopRemark, setMopRemark] = useState<string>("");
  const [loadingFaicaFiles, setLoadingFaicaFiles] = useState<boolean>(true);
  const [loadingMopFiles, setLoadingMopFiles] = useState<boolean>(true);
  const [faicaFiles, setFaicaFiles] = useState<any[]>([]);
  const [mopFiles, setMopFiles] = useState<any[]>([]);

  const handleFileUpload = async (
    file: File,
    folderPath: string,
    productId: number
  ): Promise<void> => {
    try {
      const siteUrl = "https://piind.sharepoint.com/sites/AppDev/AMS";
      await uploadFileToSharePoint(siteUrl, folderPath, file, productId);

      // Update status and RunWF in the SharePoint list based on the uploaded file type
      const listName = globalVariables.listName_Artwork;
      const statusUpdate =
        folderPath === "ArtworkLibrary/FAICA"
          ? { Status: "Facial File Uploaded", RunWF: "Yes" }
          : folderPath === "ArtworkLibrary/MOP"
          ? { Status: "MOP File Uploaded", RunWF: "Yes" }
          : {};

      if (Object.keys(statusUpdate).length > 0) {
        await sp.web.lists
          .getByTitle(listName)
          .items.getById(productId)
          .update(statusUpdate);
      }

      notification.success({
        message: "Upload Successful",
        description: `${file.name} has been uploaded to ${folderPath}, status updated, and workflow triggered.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      notification.error({
        message: "Upload Failed",
        description: `Failed to upload ${file.name}. Please try again.`,
      });
    }
  };

  useEffect(() => {
    if (!visible) {
      form.resetFields();

      setFaicaFiles([]);
      setMopFiles([]);

      setLoadingFaicaFiles(true);
      setLoadingMopFiles(true);
    }
  }, [visible, form]);

  const fetchUploadedFiles = async (): Promise<void> => {
    if (!productId) return;
    try {
      // setLoadingFiles(true);
      // const folderPath = "ArtworkLibrary/CIBRC Files"; // Example folder path
      // const files = await fetchFilesFromFolder("https://piind.sharepoint.com/sites/AppDev/AMS", folderPath, productId);
      // setFiles(files);
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
    } finally {
      // setLoadingFiles(false);
    }
  };

  const fetchFaicaFiles = async (): Promise<void> => {
    if (!productId) return;
    try {
      setLoadingFaicaFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/FAICA")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${productId}`)
        .get();
      setFaicaFiles(files);
    } catch (error) {
      console.error("Error fetching FAICA files:", error);
    } finally {
      setLoadingFaicaFiles(false);
    }
  };

  const fetchMopFiles = async (): Promise<void> => {
    if (!productId) return;
    try {
      setLoadingMopFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/MOP")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${productId}`)
        .get();
      setMopFiles(files);
    } catch (error) {
      console.error("Error fetching MOP files:", error);
    } finally {
      setLoadingMopFiles(false);
    }
  };

  // Helper for file table columns
  const fileColumns = [
    {
      title: "File Name",
      dataIndex: "Name",
      key: "Name",
      render: (text: string, record: any) => (
        <a
          href={record.ServerRelativeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1964af", fontWeight: 500 }}
        >
          {text}
        </a>
      ),
    },
    {
      title: "Download",
      key: "Download",
      render: (_: any, record: any) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => window.open(record.ServerRelativeUrl, "_blank")}
        >
          Download
        </Button>
      ),
    },
  ];

  React.useEffect(() => {
    fetchUploadedFiles().catch((error) =>
      console.error("Error in fetchUploadedFiles:", error)
    );
  }, [productId]);

  useEffect(() => {
    if (visible) {
      fetchFaicaFiles().catch((error) =>
        console.error("Error in fetchFaicaFiles:", error)
      );
      fetchMopFiles().catch((error) =>
        console.error("Error in fetchMopFiles:", error)
      );
    }
  }, [visible, productId]);

  React.useEffect(() => {
    form.setFieldsValue({
      fgCode: initialFGCode,
      boxText: initialBOM,
      brandName: initialBrandName,
    });
  }, [initialFGCode, initialBOM, initialBrandName, form]);

  // Fetch approval status and remarks for Facia and MOP
  useEffect(() => {
    const fetchFileStatuses = async (): Promise<void> => {
      if (!productId) return;
      try {
        // Fetch Facia file status
        const faciaFiles = await sp.web
          .getFolderByServerRelativeUrl("ArtworkLibrary/FAICA")
          .files.select(
            "UniqueId",
            "ListItemAllFields/DocID",
            "ListItemAllFields/Status",
            "ListItemAllFields/Remark"
          )
          .expand("ListItemAllFields")
          .filter(`ListItemAllFields/DocID eq ${productId}`)
          .get();
        if (faciaFiles.length > 0) {
          const faciaFile: any = faciaFiles[0];
          setFaciaStatus(faciaFile.ListItemAllFields?.Status || "Pending");
          setFaciaRemark(faciaFile.ListItemAllFields?.Remark || "");
        } else {
          setFaciaStatus(null);
          setFaciaRemark("");
        }
        // Fetch MOP file status
        const mopFiles = await sp.web
          .getFolderByServerRelativeUrl("ArtworkLibrary/MOP")
          .files.select(
            "UniqueId",
            "ListItemAllFields/DocID",
            "ListItemAllFields/Status",
            "ListItemAllFields/Remark"
          )
          .expand("ListItemAllFields")
          .filter(`ListItemAllFields/DocID eq ${productId}`)
          .get();
        if (mopFiles.length > 0) {
          const mopFile: any = mopFiles[0];
          setMopStatus(mopFile.ListItemAllFields?.Status || "Pending");
          setMopRemark(mopFile.ListItemAllFields?.Remark || "");
        } else {
          setMopStatus(null);
          setMopRemark("");
        }
      } catch {
        setFaciaStatus(null);
        setMopStatus(null);
        setFaciaRemark("");
        setMopRemark("");
      }
    };
    fetchFileStatuses();
  }, [productId, isFaciaAvailable, isMopAvailable]);

  const handleFinish = async (values: Record<string, any>): Promise<void> => {
    if (!productId) {
      notification.error({
        message: "Error",
        description: "Product ID is missing. Cannot update PM CM Task.",
      });
      return;
    }

    try {
      const listName = globalVariables.listName_Artwork; // Replace with your list name

      const metadata = {
        FGCode: values.fgCode,
        BOM: values.boxText,
        BrandName: values.brandName,
      };

      await sp.web.lists
        .getByTitle(listName)
        .items.getById(productId)
        .update(metadata);

      notification.success({
        message: "Success",
        description: "PM CM Task updated successfully.",
      });
    } catch (error) {
      console.error("Error updating PM CM Task:", error);
      notification.error({
        message: "Error",
        description: "Failed to update PM CM Task. Please try again.",
      });
    }
  };

  return (
    <Form layout="vertical" form={form} onFinish={handleFinish}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Brand Name"
            name="brandName"
            rules={[
              { required: true, message: "Please enter the brand name!" },
            ]}
          >
            <Input
              placeholder="Enter Brand Name"
              disabled={currentStage > 2 && !isOwner}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="FG Code"
            name="fgCode"
            rules={[{ required: true, message: "Please enter the FG Code!" }]}
          >
            <Input
              placeholder="Enter FG Code"
              disabled={currentStage > 2 && !isOwner}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="BOM"
            name="boxText"
            rules={[{ required: true, message: "Please enter the Box Text!" }]}
          >
            <Input
              placeholder="Enter Box Text"
              disabled={currentStage > 2 && !isOwner}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Uploaded Files Section */}
      <Row gutter={16}>
        <Col span={12}>
          {/* Facia File Section */}
          {!isFaciaAvailable && faciaStatus !== "Approved" && (
            <div
              style={{
                marginBottom: "16px",
                padding: "16px",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h4 style={{ color: "#1890ff" }}>Facia File</h4>
              {faciaStatus === "Rejected" && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "red" }}>Rejected</span>
                  {faciaRemark && (
                    <div>
                      <b>Remark:</b> {faciaRemark}
                    </div>
                  )}
                </div>
              )}
              <Form.Item label="Upload Facia File" name="uploadFacia">
                <Upload
                  beforeUpload={(file) => {
                    if (productId) {
                      handleFileUpload(file, "ArtworkLibrary/FAICA", productId);
                    } else {
                      notification.error({
                        message: "Error",
                        description:
                          "Product ID is missing. Cannot upload Facia file.",
                      });
                    }
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload Facia</Button>
                </Upload>
              </Form.Item>
            </div>
          )}

          {/* MOP File Section */}
          {!isMopAvailable && mopStatus !== "Approved" && (
            <div
              style={{
                marginBottom: "16px",
                padding: "16px",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h4 style={{ color: "#1890ff" }}>MOP File</h4>
              {mopStatus === "Rejected" && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: "red" }}>Rejected</span>
                  {mopRemark && (
                    <div>
                      <b>Remark:</b> {mopRemark}
                    </div>
                  )}
                </div>
              )}
              <Form.Item label="Upload MOP File" name="uploadMop">
                <Upload
                  beforeUpload={(file) => {
                    if (productId) {
                      handleFileUpload(file, "ArtworkLibrary/MOP", productId);
                    } else {
                      notification.error({
                        message: "Error",
                        description:
                          "Product ID is missing. Cannot upload MOP file.",
                      });
                    }
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload MOP</Button>
                </Upload>
              </Form.Item>
            </div>
          )}
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <div
            style={{
              margin: "24px 0 8px 0",
              fontWeight: 600,
              fontSize: 16,
              color: "#1964af",
            }}
          >
            <FileOutlined style={{ marginRight: 8 }} />
            FAICA Files
          </div>
          {loadingFaicaFiles ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={faicaFiles}
              columns={fileColumns}
              rowKey="UniqueId"
              pagination={false}
              bordered
              locale={{ emptyText: "No FAICA files attached." }}
              size="small"
            />
          )}
        </Col>
        <Col span={12}>
          <div
            style={{
              margin: "24px 0 8px 0",
              fontWeight: 600,
              fontSize: 16,
              color: "#1964af",
            }}
          >
            <FileOutlined style={{ marginRight: 8 }} />
            MOP Files
          </div>
          {loadingMopFiles ? (
            <Spin size="large" />
          ) : (
            <Table
              dataSource={mopFiles}
              columns={fileColumns}
              rowKey="UniqueId"
              pagination={false}
              bordered
              locale={{ emptyText: "No MOP files attached." }}
              size="small"
            />
          )}
        </Col>
      </Row>

      {/* Submit Button */}
      {(faciaStatus !== "Approved" || mopStatus !== "Approved") && (
        <Button type="primary" htmlType="submit" className={styles.submitButton}>
          Submit PM CM Task
        </Button>
      )}
    </Form>
  );
};

export default PMCMTask;
