/* eslint-disable no-void */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @rushstack/no-new-null */
import * as React from "react";
import { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  Select,
  Input,
  DatePicker,
  Button,
  Row,
  Col,
  notification,
  Spin,
  Steps,
  Table,
  Upload,
} from "antd";
// import { DownloadOutlined, FileOutlined } from "@ant-design/icons";
import { sp } from "@pnp/sp/presets/all";
import * as moment from "moment";
import { useLoading } from "../contexts/LoadingContext";
import PMCMTask from "./PMCMTask/PMCMTask";
import QCTask from "./QCTask/QCTask";
import MarketingServicesTask from "./MarketingServices/MarketingServicesTask";
import { getSharePointItems, updateSharePointItem, } from "../Services/SharepointListServies";
import { globalVariables, listURL } from "../Utils/globalVariable";
import SCMForm from "./SCM/SCMForm";

const { Option } = Select;
const { Step } = Steps;

interface ProductDetailsDrawerProps {
  visible: boolean;
  onClose: () => void;
  itemId: number | null;
  mode: "view" | "edit";
}

const ProductDetailsDrawer: React.FC<ProductDetailsDrawerProps> = ({
  visible,
  onClose,
  itemId,
  mode,
}) => {
  const { setLoading } = useLoading();
  const [form] = Form.useForm();
  const [registrationTypes, setRegistrationTypes] = useState<string[]>([]);
  const [registrationCategories, setRegistrationCategories] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  // const [scmData, ] = useState<any>(null); // State to hold SCM data

  // New states for separate file categories
  const [cibrcFiles, setCibrcFiles] = useState<any[]>([]);
  const [faicaFiles, setFaicaFiles] = useState<any[]>([]);
  const [mopFiles, setMopFiles] = useState<any[]>([]);
  const [loadingCibrcFiles, setLoadingCibrcFiles] = useState<boolean>(true);
  const [, setLoadingFaicaFiles] = useState<boolean>(true);
  const [, setLoadingMopFiles] = useState<boolean>(true);
  const [isFaicaApproved, setIsFaicaApproved] = useState(false);

  const steps = [
    { title: "Product Details" },
    { title: "PM, CM Task" },
    ...(form.getFieldValue("status") === "MOP File Approved" ? [{ title: "QC Task" }] : []),
    ...(isFaicaApproved  ? [{ title: "Marketing Services" }] : []),
    { title: "SCM Task" },

  ];

  // Check user group and FAICA approval
  useEffect(() => {
    const checkFaicaApproved = async (): Promise<void> => {
      if (!itemId) return;
      const faicaFiles = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/FAICA")
        .files.select("ListItemAllFields/DocID", "ListItemAllFields/Status")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${itemId}`)
        .get();
      setIsFaicaApproved(faicaFiles.some(f => (f as any).ListItemAllFields?.Status === "Approved"));
    };

    if (visible) {
      checkFaicaApproved().catch((error) =>
        notification.error({ message: "Error", description: "Failed to check FAICA approval." })
      );
    }
  }, [visible, itemId]);

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

  // Fetch item details and prefill the form
  const fetchItemDetails = async (): Promise<void> => {
    if (!itemId) return;
    try {
      setLoading(true);
      const siteUrl = listURL.dev_Artwork;
      const listName = globalVariables.listName_Artwork;

      sp.setup({
        sp: {
          baseUrl: siteUrl,
        },
      });

      try {
        const item = await sp.web.lists.getByTitle(listName).items.getById(itemId).get();
        form.setFieldsValue({
          productName: item.Title,
          registrationType: item.RegistrationType,
          registrationCategory: item.RegistrationCategory,
          productType: item.ProductType,
          rcNumber: item.RCNumber,
          factoryAddress: item.FactoryAddress,
          cibCertificateNo: item.CIBCertificateNo_x002e_,
          certificateDate: item.CertificateDate ? moment(item.CertificateDate) : null,
          FGCode: item.FGCode,
          BOM: item.BOM,
          BrandName: item.BrandName,
          MOP: item.MOP,
          status: item.Status, // Add status field
        });
      } catch (error) {
        console.error("Error fetching item details:", error);
      }
    } catch (error) {
      console.error("Error fetching item details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Modify fetchCibrcFiles to ensure it fetches files associated with the itemId
  const fetchCibrcFiles = async (): Promise<void> => {
    if (!itemId) return;
    try {
      setLoadingCibrcFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/CIBRC Files")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${itemId}`) // Filter files by DocID
        .get();
      setCibrcFiles(files);
    } catch (error) {
      console.error("Error fetching CIBRC files:", error);
    } finally {
      setLoadingCibrcFiles(false);
    }
  };

  // Function to handle file upload
  const handleFileUpload = async (file: any): Promise<void> => {
    if (!itemId) return;
    try {
      const folderUrl = "ArtworkLibrary/CIBRC Files";
      const fileName = file.name;

      // Upload the file to the folder
      const uploadedFile = await sp.web.getFolderByServerRelativeUrl(folderUrl).files.add(fileName, file, true);

      // Set the DocID field in the file's metadata
      const item = await uploadedFile.file.getItem();
      await item.update({
        DocID: itemId, // Associate the file with the itemId
      });

      notification.success({
        message: "File Uploaded",
        description: `${fileName} uploaded successfully.`,
      });

      // Refresh the CIBRC files list
      await fetchCibrcFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      notification.error({
        message: "Error",
        description: "Failed to upload the file. Please try again.",
      });
    }
  };

  const fetchFaicaFiles = async (): Promise<void> => {
    if (!itemId) return;
    try {
      setLoadingFaicaFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/FAICA")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${itemId}`)
        .get();
      setFaicaFiles(files);
    } catch (error) {
      console.error("Error fetching FAICA files:", error);
    } finally {
      setLoadingFaicaFiles(false);
    }
  };

  const fetchMopFiles = async (): Promise<void> => {
    if (!itemId) return;
    try {
      setLoadingMopFiles(true);
      const files = await sp.web
        .getFolderByServerRelativeUrl("ArtworkLibrary/MOP")
        .files.select("Name", "ServerRelativeUrl", "UniqueId")
        .expand("ListItemAllFields")
        .filter(`ListItemAllFields/DocID eq ${itemId}`)
        .get();
      setMopFiles(files);
    } catch (error) {
      console.error("Error fetching MOP files:", error);
    } finally {
      setLoadingMopFiles(false);
    }
  };

  // Fetch user group and current stage
  useEffect(() => {
    const fetchUserAndStage = async (): Promise<void> => {
      try {
        const groups = await sp.web.currentUser.groups();
        //  const isPMCMMember = groups.some((group) => group.Title === "PM_CM_Member");
        const isOwnerGroup = groups.some((group) => group.Title === "Artwork Management System Owners");


        // setCurrentUserGroup(isPMCMMember ? "PM_CM_Member" : null); 
        setIsOwner(isOwnerGroup); // Set owner state

        if (itemId) {
          const item = await sp.web.lists.getByTitle(globalVariables.listName_Artwork)
            .items.getById(itemId)
            .select("CurrentStage")
            .get();
          setCurrentStage(item.CurrentStage || 1);
        }
      } catch (error) {
        console.error("Error fetching user group or stage:", error);
      }
    };

    fetchUserAndStage().catch((error) => console.error("Error in fetchUserAndStage:", error));
  }, [itemId]);

  useEffect(() => {
    fetchRegistrationData().catch((error) =>
      console.error("Error in fetchRegistrationData:", error)
    );
    fetchProductTypes().catch((error) =>
      console.error("Error in fetchProductTypes:", error)
    );
    if (visible) {
      fetchItemDetails().catch((error) =>
        console.error("Error in fetchItemDetails:", error)
      );
      fetchCibrcFiles().catch((error) =>
        console.error("Error in fetchCibrcFiles:", error)
      );
      fetchFaicaFiles().catch((error) =>
        console.error("Error in fetchFaicaFiles:", error)
      );
      fetchMopFiles().catch((error) =>
        console.error("Error in fetchMopFiles:", error)
      );
    }
  }, [visible, itemId]);

  // Ensure data fetching for PMCM tab
  useEffect(() => {
    if (visible && currentStage === 2) {
      fetchFaicaFiles().catch((error) => console.error("Error in fetchFaicaFiles:", error));
      fetchMopFiles().catch((error) => console.error("Error in fetchMopFiles:", error));
    }
  }, [visible, currentStage]);

  // Reset form and file states properly when switching between items or stages
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCibrcFiles([]);
      setFaicaFiles([]);
      setMopFiles([]);
      setLoadingCibrcFiles(true);
      setLoadingFaicaFiles(true);
      setLoadingMopFiles(true);
    }
  }, [visible]);

  // Fetch item details and files in sequence when drawer opens or currentStage changes
  useEffect(() => {
    if (visible && itemId) {
      (async () => {
        await fetchItemDetails();
        await Promise.all([
          fetchCibrcFiles(),
          fetchFaicaFiles(),
          fetchMopFiles(),
        ]);
      })().catch((error) => {
        console.error("Error in sequential fetch:", error);
      });
    }
  }, [visible, itemId, currentStage]);

   const handleSubmit = async (values: Record<string, any>): Promise<void> => {
    try {
      setLoading(true);

      const siteUrl = listURL.dev_Artwork;
      const listName = globalVariables.listName_Artwork;

      const metadata = {
        Title: values.productName,
        RegistrationType: values.registrationType,
        RegistrationCategory: values.registrationCategory,
        ProductType: values.productType,
        FactoryAddress: values.factoryAddress,
        CIBCertificateNo_x002e_: values.cibCertificateNo,
        CertificateDate: values.certificateDate ? values.certificateDate.toISOString() : null,
      };

      if (itemId) {
        // Update existing item
        await updateSharePointItem(siteUrl, listName, itemId, metadata);
        notification.success({
          message: "Success",
          description: "Product updated successfully.",
        });
      } else {
        notification.error({
          message: "Error",
          description: "Item ID is missing. Cannot update the product.",
        });
      }
    } catch (error) {
      console.error("Error submitting product:", error);
      notification.error({
        message: "Error",
        description: "There was an error updating the product. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStageTransition = async (): Promise<void> => {
    if (!itemId) return;
    try {
      await sp.web.lists.getByTitle(globalVariables.listName_Artwork)
        .items.getById(itemId)
        .update({ CurrentStage: currentStage + 1 });
      setCurrentStage(currentStage + 1);
      notification.success({
        message: "Stage Updated",
        description: `Moved to Stage ${currentStage + 1}.`,
      });
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  // Helper to check if all required fields and files are available
  const isPMCMComplete = React.useMemo(() => {
    // Check if BrandName, FGCode, BOM are filled
    const values = form.getFieldsValue();
    const hasBrandName = !!values.BrandName && values.BrandName.trim() !== "";
    const hasFGCode = !!values.FGCode && values.FGCode.trim() !== "";
    const hasBOM = !!values.BOM && values.BOM.trim() !== "";
    // Check if at least one FAICA and one MOP file are present
    const hasFaicaFile = faicaFiles.length > 0;
    const hasMopFile = mopFiles.length > 0;
    return hasBrandName && hasFGCode && hasBOM && hasFaicaFile && hasMopFile;
  }, [form, faicaFiles, mopFiles]);

  // Automatically move to stage 3 if all PMCM requirements are met
  useEffect(() => {
    if (currentStage === 2 && isPMCMComplete) {
      setCurrentStage(3);
      // Optionally update SharePoint as well
      if (itemId) {
        sp.web.lists.getByTitle(globalVariables.listName_Artwork)
          .items.getById(itemId)
          .update({ CurrentStage: 3 })
          .catch((error) => console.error("Error updating stage to 3:", error));
      }
    }
  }, [isPMCMComplete, currentStage, itemId]);

  // Define columns for the CIBRC files table
  const fileColumns = [
    {
      title: "File Name",
      dataIndex: "Name",
      key: "name",
      render: (text: string, record: any) => (
        <a href={record.ServerRelativeUrl} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <a href={record.ServerRelativeUrl} target="_blank" rel="noopener noreferrer">
          Download
        </a>
      ),
    },
  ];
  
    return (
      <Drawer
        title={mode === "edit" ? "Edit Product" : "View Product Details"}
        width={2000}
        onClose={onClose}
        visible={visible}
        bodyStyle={{ paddingBottom: 80 }}
        destroyOnClose
      >
        <Steps current={currentStage - 1} onChange={(step) => setCurrentStage(step + 1)} style={{ marginBottom: "24px" }}>
          {steps.map((step, idx) => (
            <Step key={idx} title={step.title} />
          ))}
        </Steps>

      {/* Product Details Tab */}
      {currentStage === 1 && (
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Product Name">
                <Input
                  name="productName"
                  value={form.getFieldValue("productName") || "N/A"}
                  readOnly={mode !== "edit"}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Registration Type" name="registrationType">
                {mode === "edit" ? (
                  <Select
                    placeholder="Select Registration Type"
                    value={form.getFieldValue("registrationType") || "N/A"}
                    disabled={mode !== "edit"}
                  >
                    {registrationTypes.map((type) => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Input value={form.getFieldValue("registrationType")} readOnly />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Registration Category">
                {mode === "edit" ? (
                  <Select
                    placeholder="Select Registration Category"
                    value={form.getFieldValue("registrationCategory") || "N/A"}
                    disabled={mode !== "edit"}
                  >
                    {registrationCategories.map((category) => (
                      <Option key={category} value={category}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Input value={form.getFieldValue("registrationCategory")} readOnly />
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Product Type">
                {mode === "edit" ? (
                  <Select
                    placeholder="Select Product Type"
                    value={form.getFieldValue("productType") || "N/A"}
                    disabled={mode !== "edit"}
                  >
                    {productTypes.map((type) => (
                      <Option key={type} value={type}>
                        {type}
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Input value={form.getFieldValue("productType")} readOnly />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Factory Address">
                {mode === "edit" ? (
                  <Input
                    name="factoryAddress"
                    value={form.getFieldValue("factoryAddress") || "N/A"}
                    readOnly={mode !== "edit"}
                  />
                ) : (
                  <Input value={form.getFieldValue("factoryAddress")} readOnly />
                )}
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="CIB Certificate No.">
                {mode === "edit" ? (
                  <Input
                    name="cibCertificateNo"
                    value={form.getFieldValue("cibCertificateNo") || "N/A"}
                    readOnly={mode !== "edit"}
                  />
                ) : (
                  <Input value={form.getFieldValue("cibCertificateNo")} readOnly />
                )}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Certificate Date">
                {mode === "edit" ? (
                  <DatePicker
                    name="certificateDate"
                    style={{ width: "100%" }}
                    value={form.getFieldValue("certificateDate") ? moment(form.getFieldValue("certificateDate")) : undefined}
                    disabled={mode !== "edit"}
                  />
                ) : (
                  <DatePicker
                    value={form.getFieldValue("certificateDate") ? moment(form.getFieldValue("certificateDate")) : undefined}
                    style={{ width: "100%" }}
                    disabled
                  />
                )}
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                <div style={{ margin: "24px 0 8px 0", fontWeight: 600, fontSize: 16, color: "#1964af" }}>
                  CIBRC Files
                </div>
                {loadingCibrcFiles ? (
                  <Spin size="large" />
                ) : cibrcFiles.length === 0 ? (
                  <div>
                    <p style={{ color: "red", fontWeight: 500 }}>No CIBRC files attached. Please upload a file.</p>
                    <Upload
                      beforeUpload={(file) => {
                        void handleFileUpload(file);
                        return false;
                      }}
                      showUploadList={false}
                    >
                      <Button type="primary">Upload File</Button>
                    </Upload>
                  </div>
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
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}

      {/* PM, CM Task Tab: Only FAICA and MOP Files */}
      {currentStage === 2 && (
        <PMCMTask
          currentStage={currentStage}
          isOwner={isOwner}
          isFaciaAvailable={faicaFiles.length > 0}
          isMopAvailable={mopFiles.length > 0}
          productId={itemId === null ? undefined : itemId}
          initialFGCode={form.getFieldValue("FGCode") || ""}
          initialBrandName={form.getFieldValue("BrandName") || ""}
          initialBOM={form.getFieldValue("BOM") || ""}
          visible={visible}
        />
      )}

      {/* QC Task Tab */}
      {currentStage === 3  && (
        <QCTask productId={itemId === null ? undefined : itemId} />
      )}

      {/* Marketing Services Task Tab */}
      {currentStage === 4 && (
        <MarketingServicesTask
          productId={itemId === null ? undefined : itemId}
          onCDRSubmit={async () => {
            try {
                await sp.web.lists.getByTitle(globalVariables.listName_Artwork)
                    .items.getById(itemId!)
                    .update({
                        Status: 'Sent to SCM', // Update the status
                        RunWF: 'YES', // Set RunWF to "YES"
                    });
                notification.success({
                    message: 'Success',
                    description: 'CDR file submitted successfully and status updated to "Sent to SCM".',
                });
            } catch (error) {
                console.error('Error updating status to "Sent to SCM":', error);
                notification.error({
                    message: 'Error',
                    description: 'Failed to update status to "Sent to SCM". Please try again.',
                });
            }
        }}
    />
      )}

      {/* SCM Task Tab */}
      {currentStage === 5  && (
        <SCMForm
          initialValues={{
            productCategories: form.getFieldValue("BrandName"),
            productName: form.getFieldValue("productName"),
            mopPackSize: form.getFieldValue("MOP"),
          }}
        />
      )}

      {/* Transition Button: Only show if not owner, not at stage 3, and PMCM is not complete */}
      {!isOwner && currentStage < 5 && !isPMCMComplete && (
        <Button
          type="primary"
          onClick={handleStageTransition}
          style={{ marginTop: "16px" }}
        >
          Move to Next Stage
        </Button>
      )}

    </Drawer>
  );
};

export default ProductDetailsDrawer;

