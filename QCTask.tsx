/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Form, Row, Col, Upload, Button, Card, notification, Spin, Table } from "antd";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import { sp } from "@pnp/sp/presets/all";

interface QCTaskProps {
  productId: number | undefined;
}

const QCTask: React.FC<QCTaskProps> = ({ productId }) => {
  const [form] = Form.useForm();
  const [engineeringDrawingList, setEngineeringDrawingList] = React.useState<any[]>([]);
  const [specificationList, setSpecificationList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch uploaded files for view
  const fetchQCFiles = React.useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const engFiles = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/EngineeringDrawing")
        .files.select("Name", "ServerRelativeUrl", "UniqueId", "ListItemAllFields/DocID")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${productId}`) // Ensure filtering by DocID
        .get();
      setEngineeringDrawingList(engFiles);

      const specFiles = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/Specification")
        .files.select("Name", "ServerRelativeUrl", "UniqueId", "ListItemAllFields/DocID")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${productId}`) // Ensure filtering by DocID
        .get();
      setSpecificationList(specFiles);
    } catch (error) {
      console.error("Error fetching QC files:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch QC files. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Upload handler for Engineering Drawing
  const handleEngineeringDrawingUpload = async (file: File): Promise<boolean> => {
    if (!productId) {
      notification.error({ message: "Error", description: "Product ID missing." });
      return false;
    }
    setLoading(true);
    try {
      const folderPath = "ArtworkLibrary/EngineeringDrawing";
      const uploadResult = await sp.web
        .getFolderByServerRelativeUrl(folderPath)
        .files.add(file.name, file, true);
      const fileItem = await uploadResult.file.getItem();
      await fileItem.update({ DocID: productId.toString() });
      notification.success({ message: "Success", description: "Engineering Drawing uploaded." });
      await fetchQCFiles();
    } catch (error) {
      console.error("Error uploading Engineering Drawing:", error);
      notification.error({ message: "Error", description: "Failed to upload Engineering Drawing." });
    } finally {
      setLoading(false);
    }
    return false;
  };

  // Upload handler for Specification
  const handleSpecificationUpload = async (file: File): Promise<boolean> => {
    if (!productId) {
      notification.error({ message: "Error", description: "Product ID missing." });
      return false;
    }
    setLoading(true);
    try {
      const folderPath = "ArtworkLibrary/Specification";
      const uploadResult = await sp.web
        .getFolderByServerRelativeUrl(folderPath)
        .files.add(file.name, file, true);
      const fileItem = await uploadResult.file.getItem();
      await fileItem.update({ DocID: productId.toString() });
      notification.success({ message: "Success", description: "Specification uploaded." });
      await fetchQCFiles();
    } catch (error) {
      console.error("Error uploading Specification:", error);
      notification.error({ message: "Error", description: "Failed to upload Specification." });
    } finally {
      setLoading(false);
    }
    return false;
  };

  React.useEffect(() => {
    if (productId) {
      fetchQCFiles().catch((error) => console.error("Error in fetchQCFiles:", error));
    }
  }, [productId, fetchQCFiles]);

  const fileColumns = [
    {
      title: "File Name",
      dataIndex: "Name",
      key: "Name",
      render: (text: string, record: any) => (
        <a href={record.ServerRelativeUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1964af", fontWeight: 500 }}>
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

  return (
    <Card title="QC Task" style={{ marginTop: 24 }}>
      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Engineering Drawing" name="engineeringDrawing">
              <Upload
                beforeUpload={handleEngineeringDrawingUpload}
                showUploadList={false}
                accept="*"
              >
                <Button icon={<UploadOutlined />}>Upload Engineering Drawing</Button>
              </Upload>
            </Form.Item>
            <Spin spinning={loading}>
              <Table
                dataSource={engineeringDrawingList}
                columns={fileColumns}
                rowKey="UniqueId"
                pagination={false}
                bordered
                size="small"
                locale={{ emptyText: "No Engineering Drawing uploaded." }}
              />
            </Spin>
          </Col>
          <Col span={12}>
            <Form.Item label="Specification" name="specification">
              <Upload
                beforeUpload={handleSpecificationUpload}
                showUploadList={false}
                accept="*"
              >
                <Button icon={<UploadOutlined />}>Upload Specification</Button>
              </Upload>
            </Form.Item>
            <Spin spinning={loading}>
              <Table
                dataSource={specificationList}
                columns={fileColumns}
                rowKey="UniqueId"
                pagination={false}
                bordered
                size="small"
                locale={{ emptyText: "No Specification uploaded." }}
              />
            </Spin>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default QCTask;
