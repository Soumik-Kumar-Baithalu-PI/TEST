/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useState, useEffect } from "react";
import { Table, Button, Input, Tag, Spin } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { getSharePointItems } from "../Services/SharepointListServies";
import type { IArtworkManagementSystemProps } from "./IArtworkManagementSystemProps";
import CreateProductForm from "./CreateProduct/CreateProductForm";
import ProductDetailsDrawer from "./ProductDetails";
import ApproverView from "./ApproverView";
import styles from "./ArtworkManagementSystem.module.scss";
import { globalVariables, listURL } from "../Utils/globalVariable";
import { sp } from "@pnp/sp/presets/all";
import { LoadingProvider } from "../contexts/LoadingContext";

const { Search } = Input;

// Update DataType to include currentStage
interface DataType {
  key: string;
  title: string;
  registrationType: string;
  registrationCategory: string;
  productType: string;
  cropLabelPesto: string;
  rcNumber: string;
  agendaNo: string;
  factoryAddress: string;
  cibCertificateNo: string;
  status: string;
  certificateDate?: string;
  currentStage?: number; // <-- Add this
  packagingType?: string; // <-- Add this
}

const ArtworkManagementSystem: React.FC<IArtworkManagementSystemProps> = (
  props
) => {
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPMCMMember, setIsPMCMMember] = useState(false);
  const [isRegulatoryMember, setIsRegulatoryMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false); // State to track if the user is an owner
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [detailsDrawerMode, setDetailsDrawerMode] = useState<"view" | "edit">("view");
  const [detailsDrawerItemId, setDetailsDrawerItemId] = useState<number | null>(null);
  const [approverDrawerVisible, setApproverDrawerVisible] = useState(false);
  const [approverProductId, setApproverProductId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null); // Track the user's role
  const [isQCMember, setIsQCMember] = useState(false); // Add this state

  const checkUserGroup = async (): Promise<void> => {
    try {
      const groups = await sp.web.currentUser.groups();
      console.log("User Groups:", groups.map((group) => group.Title)); // Debugging log

      const regulatoryMember = groups.some(
        (group) => group.Title === "Regulatory Member"
      );
      const pmcmMember = groups.some((group) => group.Title === "PM_CM_Member");
      const owner = groups.some(
        (group) => group.Title === "Artwork Management System Owners"
      );
      const ceoGroup = groups.some((group) => group.Title === "CEO");
      const marketingHeadApprover = groups.some((group) => group.Title === "MarketingHead_CEO_Approver");
      const qcMember = groups.some((group) => group.Title === "QC_Member");

      setIsRegulatoryMember(regulatoryMember);
      setIsPMCMMember(pmcmMember);
      setIsOwner(owner);
      setIsQCMember(qcMember);

      // Set the user's role based on group membership
      if (ceoGroup) {
        setCurrentUserRole("CEO");
      } else if (marketingHeadApprover) {
        setCurrentUserRole("MarketingHead");
      } else {
        setCurrentUserRole(null); // Default to null if no matching role
      }
    } catch (error) {
      console.error("Error checking user group membership:", error);
    }
  };

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
        const siteUrl = listURL.dev_Artwork;
        const listName = globalVariables.listName_Artwork;

        const items = await getSharePointItems(siteUrl, listName);

        const tableData: DataType[] = items.map((item) => ({
            key: item.ID.toString(),
            title: item.Title || "N/A",
            registrationType: item.RegistrationType || "N/A",
            registrationCategory: item.RegistrationCategory || "N/A",
            productType: item.ProductType || "N/A",
            cropLabelPesto: item.CropLabel_x002f_Pesto || "N/A",
            rcNumber: item.RCNumber || "N/A",
            agendaNo: item.AgendaNo_x002e_ || "N/A",
            factoryAddress: item.FactoryAddress || "N/A",
            cibCertificateNo: item.CIBCertificateNo_x002e_ || "N/A",
            status: item.Status || "Pending",
            certificateDate: item.CertificateDate || null,
            currentStage: item.CurrentStage,
        }));
        setData(tableData);
    } catch (error) {
        console.error("Error fetching data from SharePoint list:", error);
    } finally {
        setLoading(false);
    }
  };

  const showDrawer = (): void => {
    setDrawerVisible(true);
  };

  const closeDrawer = (): void => {
    setDrawerVisible(false);
    fetchData().catch((error) => console.error("Error in fetchData:", error));
  };

  // Replace handleViewItem and showEditDrawer with a unified handler
  const openProductDetailsDrawer = (itemId: number, mode: "view" | "edit") => {
    // No need to set itemDetails
    setDetailsDrawerItemId(itemId);
    setDetailsDrawerMode(mode);
    setDetailsDrawerVisible(true);
  };

  const closeProductDetailsDrawer = () => {
    setDetailsDrawerVisible(false);
    setDetailsDrawerItemId(null);
    fetchData().catch((error) => console.error("Error in fetchData:", error));
  };

  const showApproverDrawer = (productId: number): void => {
    setApproverDrawerVisible(true);
    setApproverProductId(productId);
  };

  const closeApproverDrawer = (): void => {
    setApproverDrawerVisible(false);
    setApproverProductId(null);
  };

  useEffect(() => {
    checkUserGroup().catch((error) =>
      console.error("Error in checkUserGroup:", error)
    );
    fetchData().catch((error) => console.error("Error in fetchData:", error));
  }, []);

  const generateFilters = (
    data: DataType[],
    key: keyof DataType
  ): { text: string; value: string }[] => {
    const uniqueValues = Array.from(new Set(data.map((item) => item[key])));
    return uniqueValues.map((value) => ({
      text: (value || "N/A").toString(),
      value: (value || "N/A").toString(),
    }));
  };

  const columns: ColumnsType<DataType> = [
    {
        title: "Action",
        dataIndex: "Action",
        key: "Action",
        render: (_: unknown, record: DataType) => (
            <div style={{ display: "flex", gap: 4 }}>
                {/* Always show View button */}
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    style={{
                        fontSize: "20px",
                        backgroundColor: "#1964af",
                        color: "#e6d11f",
                        fontWeight: "bold",
                        minWidth: "2em"
                    }}
                    onClick={() => openProductDetailsDrawer(Number(record.key), "view")}
                />
                {/* Show Edit button only if user is allowed at this stage */}
                {(isPMCMMember || isOwner) && record.currentStage === 2 && record.status !== "Completed" && (
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        style={{
                            fontSize: "20px",
                            backgroundColor: "#e6d11f",
                            color: "#1964af",
                            fontWeight: "bold",
                            minWidth: "2em"
                        }}
                        onClick={() => openProductDetailsDrawer(Number(record.key), "edit")}
                    />
                )}
                {isQCMember && record.currentStage === 4 && record.status !== "Completed" && (
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        style={{
                            fontSize: "20px",
                            backgroundColor: "#e6d11f",
                            color: "#1964af",
                            fontWeight: "bold",
                            minWidth: "2em"
                        }}
                        onClick={() => openProductDetailsDrawer(Number(record.key), "edit")}
                    />
                )}
                {/* Approve button for CEO/MarketingHead at stage 2 */}
                {(currentUserRole === "CEO" || currentUserRole === "MarketingHead") && record.currentStage === 2 && (
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => showApproverDrawer(Number(record.key))}
                    >
                        Approve
                    </Button>
                )}
            </div>
        ),
    },
    {
      title: "Product Name", // Updated column name
      dataIndex: "title",
      key: "title",
      filters: generateFilters(data, "title"),
      onFilter: (value, record) =>
        record.title?.toLowerCase() === (value as string).toLowerCase(),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Registration Type",
      dataIndex: "registrationType",
      key: "registrationType",
      filters: generateFilters(data, "registrationType"),
      onFilter: (value, record) =>
        record.registrationType?.toLowerCase() === (value as string).toLowerCase(),
      sorter: (a, b) =>
        a.registrationType.localeCompare(b.registrationType),
    },
    {
      title: "Registration Category",
      dataIndex: "registrationCategory",
      key: "registrationCategory",
      filters: generateFilters(data, "registrationCategory"),
      onFilter: (value, record) =>
        record.registrationCategory?.toLowerCase() ===
        (value as string).toLowerCase(),
      sorter: (a, b) =>
        a.registrationCategory.localeCompare(b.registrationCategory),
    },
    {
      title: "Product Type",
      dataIndex: "productType",
      key: "productType",
      filters: generateFilters(data, "productType"),
      onFilter: (value, record) =>
        record.productType?.toLowerCase() === (value as string).toLowerCase(),
      sorter: (a, b) => a.productType.localeCompare(b.productType),
    },
    {
      title: "CIB Certificate Date",
      dataIndex: "certificateDate",
      key: "certificateDate",
      filters: generateFilters(data, "certificateDate"),
      onFilter: (value, record) => record.certificateDate === value,
      sorter: (a, b) =>
        new Date(a.certificateDate || "").getTime() -
        new Date(b.certificateDate || "").getTime(),
      render: (certificateDate: string) =>
        certificateDate ? new Date(certificateDate).toLocaleDateString() : "N/A", // Format the date
    },
    {
      title: "Factory Address",
      dataIndex: "factoryAddress",
      key: "factoryAddress",
      filters: generateFilters(data, "factoryAddress"),
      onFilter: (value, record) =>
        record.factoryAddress?.toLowerCase() === (value as string).toLowerCase(),
      sorter: (a, b) => a.factoryAddress.localeCompare(b.factoryAddress),
    },
    {
      title: "CIB Certificate No.",
      dataIndex: "cibCertificateNo",
      key: "cibCertificateNo",
      filters: generateFilters(data, "cibCertificateNo"),
      onFilter: (value, record) =>
        record.cibCertificateNo?.toLowerCase() === (value as string).toLowerCase(),
      sorter: (a, b) => a.cibCertificateNo.localeCompare(b.cibCertificateNo),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: generateFilters(data, "status"),
      onFilter: (value, record) =>
        record.status?.toLowerCase() === (value as string).toLowerCase(),
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status: string) => {
        const color =
          status === "Completed"
            ? "green"
            : status === "In Progress"
            ? "blue"
            : "volcano";
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <LoadingProvider>
      <div className={styles.artworkManagementSystem}>
        <h1 className={styles.dashboardTitle} style={{ color: "#1890ff" }}>
          Artwork Management System Dashboard
        </h1>
        <div className={styles.actionBar}>
          <Search
            className={styles.searchInput}
            placeholder="Search..."
            onSearch={(value: string) => console.log(value)}
            enterButton
          />
          <div className={styles.actionButtons}>
            {(isRegulatoryMember || isOwner) && ( // Allow owners to create new products
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showDrawer}
              >
                Create New Product
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <Spin size="large" className={styles.loadingSpinner} />
        ) : (
          <Table
            columns={columns}
            dataSource={data}
            bordered
            pagination={{ pageSize: 10 }}
            // scroll={{ x: 'max-content' }} // Add horizontal scroll
          />
        )}
        <CreateProductForm visible={drawerVisible} onClose={closeDrawer} />
        <ProductDetailsDrawer
          visible={detailsDrawerVisible}
          onClose={closeProductDetailsDrawer}
          itemId={detailsDrawerItemId}
          mode={detailsDrawerMode}
        />
   
          {approverProductId && approverDrawerVisible && (currentUserRole === "CEO" || currentUserRole === "MarketingHead") && (
            <ApproverView
              productId={approverProductId}
              currentUserRole={currentUserRole}
              visible={approverDrawerVisible} // Pass the visibility state
              onClose={closeApproverDrawer} // Pass the onClose handler
            />
          )}

      </div>
    </LoadingProvider>
  );
};

export default ArtworkManagementSystem;