/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { Drawer, Form, Input, DatePicker, Row, Col, Spin, Button, Steps, Table } from "antd";
import * as moment from "moment";
import { sp } from "@pnp/sp/presets/all";
import { DownloadOutlined } from "@ant-design/icons";

const { Step } = Steps;

interface ViewProductProps {
  visible: boolean;
  onClose: () => void;
  itemDetails: any;
}

const ViewProduct: React.FC<ViewProductProps> = ({ visible, onClose, itemDetails }) => {
  const [cibrcFiles, setCibrcFiles] = useState<any[]>([]);
  const [faicaFiles, setFaicaFiles] = useState<any[]>([]);
  const [mopFiles, setMopFiles] = useState<any[]>([]);
  const [loadingCibrcFiles, setLoadingCibrcFiles] = useState<boolean>(true);
  const [loadingFaicaFiles, setLoadingFaicaFiles] = useState<boolean>(true);
  const [loadingMopFiles, setLoadingMopFiles] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Fetch files for each folder separately
  const fetchCibrcFiles = async (): Promise<void> => {
    if (!itemDetails?.key) return;
    try {
      setLoadingCibrcFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/CIBRC Files")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${itemDetails.key}`)
        .get();
      setCibrcFiles(files);
    } catch (error) {
      console.error("Error fetching CIBRC files:", error);
    } finally {
      setLoadingCibrcFiles(false);
    }
  };

  const fetchFaicaFiles = async (): Promise<void> => {
    if (!itemDetails?.key) return;
    try {
      setLoadingFaicaFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/FAICA")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${itemDetails.key}`)
        .get();
      setFaicaFiles(files);
    } catch (error) {
      console.error("Error fetching FAICA files:", error);
    } finally {
      setLoadingFaicaFiles(false);
    }
  };

  const fetchMopFiles = async (): Promise<void> => {
    if (!itemDetails?.key) return;
    try {
      setLoadingMopFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/MOP")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${itemDetails.key}`)
        .get();
      setMopFiles(files);
    } catch (error) {
      console.error("Error fetching MOP files:", error);
    } finally {
      setLoadingMopFiles(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCibrcFiles().catch((error) => console.error("Error in fetchCibrcFiles:", error));
      fetchFaicaFiles().catch((error) => console.error("Error in fetchFaicaFiles:", error));
      fetchMopFiles().catch((error) => console.error("Error in fetchMopFiles:", error));
    }
  }, [visible, itemDetails]);

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
    <Drawer
      title="View Product Details"
      width={1200}
      onClose={onClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
    >
      <Steps current={currentStep} onChange={setCurrentStep} style={{ marginBottom: "24px" }}>
        <Step title="Product Details" />
        <Step title="PM, CM Task" />
        <Step title="File Uploads" />
        <Step title="QC Task" />
      </Steps>

      {/* Product Details Tab: Only CIBRC Files */}
      {currentStep === 0 && (
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Product Name">
                <Input value={itemDetails?.title} readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Registration Type">
                <Input value={itemDetails?.registrationType} readOnly />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Registration Category">
                <Input value={itemDetails?.registrationCategory} readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Product Type">
                <Input value={itemDetails?.productType} readOnly />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Packaging Type">
                <Input value={itemDetails?.packagingType} readOnly />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Factory Address">
                <Input value={itemDetails?.factoryAddress} readOnly />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="CIB Certificate No.">
                <Input value={itemDetails?.cibCertificateNo} readOnly />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Certificate Date">
                <DatePicker
                  value={itemDetails?.certificateDate ? moment(itemDetails.certificateDate) : undefined}
                  style={{ width: "100%" }}
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <div style={{ margin: "24px 0 8px 0", fontWeight: 600, fontSize: 16, color: "#1964af" }}>
                CIBRC Files
              </div>
              {loadingCibrcFiles ? (
                <Spin size="large" />
              ) : (
                <Table
                  dataSource={cibrcFiles}
                  columns={fileColumns}
                  rowKey="UniqueId"
                  pagination={false}
                  bordered
                  locale={{ emptyText: "No CIBRC files attached." }}
                  size="small"
                />
              )}
            </Col>
          </Row>
        </Form>
      )}

      {/* PM, CM Task Tab: Only FAICA and MOP Files, and show FG Code, Brand Name, BOM, MOP */}
      {currentStep === 1 && (
        <>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Brand Name">
                  <Input value={itemDetails?.BrandName || itemDetails?.brandName} readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="FG Code">
                  <Input value={itemDetails?.FGCode || itemDetails?.fgCode} readOnly />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="BOM">
                  <Input value={itemDetails?.BOM || itemDetails?.bom} readOnly />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="MOP">
                  <Input value={itemDetails?.MOP || itemDetails?.mop} readOnly />
                </Form.Item>
              </Col>
            </Row>
          </Form>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ margin: "24px 0 8px 0", fontWeight: 600, fontSize: 16, color: "#1964af" }}>
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
              <div style={{ margin: "24px 0 8px 0", fontWeight: 600, fontSize: 16, color: "#1964af" }}>
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
        </>
      )}

      {/* File Uploads Tab: Show all files */}
      {currentStep === 2 && (
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ margin: "24px 0 8px 0", fontWeight: 600, fontSize: 16, color: "#1964af" }}>
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
            <div style={{ margin: "24px 0 8px 0", fontWeight: 600, fontSize: 16, color: "#1964af" }}>
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
      )}

      {/* QC Task Tab: (optional, if you want to show QC uploads in view) */}
      {/* {currentStep === 3 && (
        <div>
          <h3>QC Task (View Only)</h3>
          // Add QC file viewing logic here if needed
        </div>
      )} */}
    </Drawer>
  );
};

export default ViewProduct;
           
