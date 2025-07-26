/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  Upload,
  Button,
  Row,
  Col,
  notification,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { UploadOutlined } from "@ant-design/icons";
import { submitProductToSharePoint, getSharePointItems } from "../../Services/SharepointListServies";
import { globalVariables, listURL } from "../../Utils/globalVariable";
import  styles from "./CreateProductForm.module.scss"; // Import your styles if needed

const { Option } = Select;

interface CreateProductProps {
  visible: boolean;
  onClose: () => void;
}

const CreateProductForm: React.FC<CreateProductProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [registrationTypes, setRegistrationTypes] = useState<string[]>([]);
  const [registrationCategories, setRegistrationCategories] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCibrcAvailable, setIsCibrcAvailable] = useState<string>("No"); // New state for CIBRC availability

  // Fetch Registration Types and Categories from SharePoint List
  const fetchRegistrationData = async (): Promise<void> => {
    try {
      const siteUrl = listURL.dev_Artwork;
      const listName = "Registration List";

      const items = await getSharePointItems(siteUrl, listName);

      const types = items
        .filter((item) => item.RegistrationType === "Type")
        .map((item) => item.Title);

      const categories = items
        .filter((item) => item.RegistrationType === "Category")
        .map((item) => item.Title);

      setRegistrationTypes(types);
      setRegistrationCategories(categories);
    } catch (error) {
      console.error("Error fetching registration data:", error);
    }
  };

  // Fetch Product Types from SharePoint List
  const fetchProductTypes = async (): Promise<void> => {
    try {
      const siteUrl = listURL.dev_Artwork;
      const listName = "Product Type";

      const items = await getSharePointItems(siteUrl, listName);

      const types = items.map((item) => item.Title);

      setProductTypes(types);
    } catch (error) {
      console.error("Error fetching product types:", error);
    }
  };

  useEffect(() => {
    fetchRegistrationData().catch((error) =>
      console.error("Error in fetchRegistrationData:", error)
    );
    fetchProductTypes().catch((error) =>
      console.error("Error in fetchProductTypes:", error)
    );
  }, []);

  const handleSubmit = async (values: Record<string, any>): Promise<void> => {
    setLoading(true);
    try {
      const siteUrl = listURL.dev_Artwork;
      const listName = globalVariables.listName_Artwork;
      const folderPath = "/sites/AppDev/AMS/ArtworkLibrary/CIBRC%20Files";

      const metadata = {
        Title: values.productName,
        RegistrationType: values.registrationType,
        RegistrationCategory: values.registrationCategory,
        ProductType: values.productType,
        FactoryAddress: values.factoryAddress,
        CIBCertificateNo_x002e_: values.cibCertificateNo,
        CertificateDate: values.certificateDate
          ? values.certificateDate.toISOString()
          : null,
        ManufacturedBy: values.manufacturedBy,
        MOP: values.packagingType, // Updated field name
        CurrentStage: 2,
        RunWF: "Yes",
        Status: "Pending on PMCM",
        CIBRCFileAvailable: isCibrcAvailable,
      };

      if (isCibrcAvailable === "Yes" && fileList.length === 0) {
        notification.error({
          message: "Error",
          description: "Please upload a CIBRC file if it is marked as available.",
        });
        setLoading(false);
        return;
      }

      if (fileList.length > 0 && fileList[0].originFileObj) {
        const itemId = await submitProductToSharePoint(
          siteUrl,
          listName,
          metadata,
          fileList[0].originFileObj,
          folderPath
        );

        notification.success({
          message: "Success",
          description: `Product created successfully with ID: ${itemId}.`,
        });
      } else {
        notification.success({
          message: "Success",
          description: "Product created successfully without a CIBRC file.",
        });
      }

      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      console.error("Error submitting product:", error);
      notification.error({
        message: "Error",
        description: "There was an error submitting the product. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (info: { file: UploadFile; fileList: UploadFile[] }): void => {
    if (info.file.status === "removed") {
      setFileList([]);
      return;
    }

    const selectedFile = info.file.originFileObj || info.file;
    if (selectedFile && selectedFile instanceof File) {
      const uploadFile: UploadFile = {
        uid: info.file.uid,
        name: info.file.name,
        status: "done",
        url: "",
        originFileObj: selectedFile,
      };

      setFileList([uploadFile]);
    }
  };

  return (
    <Modal
      title="Submit Product Details"
      visible={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={800}
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Product Name"
              name="productName"
              rules={[{ required: true, message: "Please enter the product name!" }]}
            >
              <Input placeholder="Enter Product Name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Registration Type"
              name="registrationType"
              rules={[{ required: true, message: "Please select a registration type!" }]}
            >
              <Select placeholder="Select Registration Type">
                {registrationTypes.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Registration Category"
              name="registrationCategory"
              rules={[{ required: true, message: "Please select a registration category!" }]}
            >
              <Select placeholder="Select Registration Category">
                {registrationCategories.map((category) => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Product Type"
              name="productType"
              rules={[{ required: true, message: "Please select a product type!" }]}
            >
              <Select placeholder="Select Product Type">
                {productTypes.map((type) => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="MOP" // Updated label
              name="packagingType" // Updated field name
              rules={[{ required: true, message: "Please enter the MOP!" }]}
            >
              <Input placeholder="Enter MOP (e.g., Box, Bag, Bottle)" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Manufactured / Import By" // Updated label
              name="manufacturedBy" // Updated field name
              rules={[{ required: true, message: "Please enter the manufacturer or importer name!" }]}
            >
              <Input placeholder="Enter Manufacturer / Importer Name" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Factory Address"
              name="factoryAddress"
              rules={[{ required: true, message: "Please enter the factory address!" }]}
            >
              <Input placeholder="Enter Factory Address" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="CIB Certificate No."
              name="cibCertificateNo"
              rules={[{ required: true, message: "Please enter the CIB Certificate No!" }]}
            >
              <Input placeholder="Enter CIB Certificate No." />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Certificate Date"
              name="certificateDate"
              rules={[{ required: true, message: "Please select the certificate date!" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="CIBRC File Available"
              name="cibrcFileAvailable"
              rules={[{ required: true, message: "Please select if CIBRC file is available!" }]}
            >
              <Select
                placeholder="Select Yes or No"
                onChange={(value) => setIsCibrcAvailable(value)}
              >
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Upload CIBRC File"
              name="cibRcFile"
              rules={[
                {
                  required: isCibrcAvailable === "Yes",
                  message: "Please upload the CIBRC file!",
                },
              ]}
            >
              <Upload
                beforeUpload={() => false}
                fileList={fileList}
                onChange={handleFileChange}
              >
                <Button icon={<UploadOutlined />}>Upload CIBRC File</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ textAlign: "center", marginTop: "24px" }}>
          <Button
            type="primary"
            htmlType="submit"
            style={{ marginRight: "16px" }}
            className={styles.sendButton}
            loading={loading}
          >
            Send
          </Button>
          <Button type="default" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateProductForm;