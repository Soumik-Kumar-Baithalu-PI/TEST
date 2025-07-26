/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-void */
import * as React from 'react';
import { Card, Table, Upload, Button, notification, Tabs, Badge, Progress, Tag, Steps, Row, Col, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, FileOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { sp } from '@pnp/sp/presets/all';
import * as moment from 'moment';

const { TabPane } = Tabs;
const { Step } = Steps;

interface VendorFile {
    ID: number;
    ProductName: string;
    FileName: string;
    Status: string;
    Remarks?: string;
    UploadDate?: string;
    FileType?: string;
}

interface AssignedProduct {
    ID: number;
    ProductName: string;
    PackingCategory: string;
    CurrentStage: number;
    Status: string;
    AssignedDate: string;
    Deadline: string;
    RequiredDocuments: string[];
    ArtworkFiles?: any[];
    CDRFiles?: any[];
    PackagingFiles?: any[];
}

const VendorDashboard = ({ supplierEmail }: { supplierEmail: string }): JSX.Element => {
    const [vendorFiles, setVendorFiles] = React.useState<VendorFile[]>([]);
    const [assignedProducts, setAssignedProducts] = React.useState<AssignedProduct[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('products');

    const vendorWorkflowSteps = [
        'Product Assignment',
        'Requirements Review',
        'Artwork Development',
        'File Submission',
        'Quality Review',
        'Final Approval'
    ];

    const fetchVendorFiles = async (): Promise<void> => {
        try {
            const listName = 'Vendor Files';
            const items = await sp.web.lists
                .getByTitle(listName)
                .items.filter(`SupplierEmail eq '${supplierEmail}'`)
                .select('ID, ProductName, FileName, Status, Remarks, Created, FileType')
                .orderBy('Created', false)
                .get();
            
            const filesWithDate = items.map(item => ({
                ...item,
                UploadDate: item.Created
            }));
            
            setVendorFiles(filesWithDate);
        } catch (error) {
            console.error('Error fetching vendor files:', error);
            notification.error({ message: 'Error', description: 'Failed to fetch vendor files.' });
        }
    };

    const fetchAssignedProducts = async (): Promise<void> => {
        try {
            const listName = 'Operational - Artwork Management Systems';
            const items = await sp.web.lists
                .getByTitle(listName)
                .items.filter(`VendorEmail eq '${supplierEmail}'`)
                .select('ID, Title, VendorCategory, CurrentStage, Status, VendorAssignedDate')
                .get();
            
            const productsData: AssignedProduct[] = items.map(item => {
                const assignedDate = moment(item.VendorAssignedDate);
                const deadline = assignedDate.clone().add(getDaysForCategory(item.VendorCategory), 'days');
                
                return {
                    ID: item.ID,
                    ProductName: item.Title,
                    PackingCategory: item.VendorCategory || 'General',
                    CurrentStage: item.CurrentStage || 1,
                    Status: item.Status || 'Assigned',
                    AssignedDate: item.VendorAssignedDate,
                    Deadline: deadline.format('YYYY-MM-DD'),
                    RequiredDocuments: getRequiredDocuments(item.VendorCategory),
                    ArtworkFiles: [],
                    CDRFiles: [],
                    PackagingFiles: []
                };
            });
            
            setAssignedProducts(productsData);
        } catch (error) {
            console.error('Error fetching assigned products:', error);
            notification.error({ message: 'Error', description: 'Failed to fetch assigned products.' });
        }
    };

    const getDaysForCategory = (category: string): number => {
        const categoryDays: { [key: string]: number } = {
            'POUCH': 45,
            'MONOCARTON': 45,
            'LABEL': 14,
            'LEAFLET': 14,
            'SHIPPER BOX': 14,
            'SHIPPER LABEL': 14,
            'BOP TAPE': 30,
            'LDPE SHRINK': 30,
            'NECK TIE': 30
        };
        return categoryDays[category] || 30;
    };

    const getRequiredDocuments = (category: string): string[] => {
        const baseDocuments = ['Artwork Proof', 'Technical Specification'];
        const categorySpecific: { [key: string]: string[] } = {
            'POUCH': [...baseDocuments, 'Material Certificate', 'Pouch Dimensions'],
            'MONOCARTON': [...baseDocuments, 'Carton Specification', 'Die-cut Layout'],
            'LABEL': [...baseDocuments, 'Label Specification', 'Adhesive Details'],
            'LEAFLET': [...baseDocuments, 'Paper Specification', 'Folding Layout']
        };
        return categorySpecific[category] || baseDocuments;
    };

    const handleFileUpload = async (file: File, productId: number, fileType: string): Promise<boolean> => {
        try {
            const product = assignedProducts.find(p => p.ID === productId);
            if (!product) {
                notification.error({ message: 'Error', description: 'Product not found.' });
                return false;
            }

            const folderPath = `VendorFiles/${supplierEmail}/${product.ProductName}/${fileType}`;
            
            // Create folder structure if it doesn't exist
            await sp.web.folders.addUsingPath(folderPath).catch(() => {
                // Folder might already exist
            });

            const uploadResult = await sp.web.getFolderByServerRelativeUrl(folderPath)
                .files.add(file.name, file, true);

            // Update the vendor files list
            await sp.web.lists.getByTitle('Vendor Files').items.add({
                SupplierEmail: supplierEmail,
                ProductID: productId,
                ProductName: product.ProductName,
                FileName: file.name,
                FileType: fileType,
                Status: 'Submitted for Review',
                FilePath: uploadResult.data.ServerRelativeUrl
            });

            // Update product status if all required files are uploaded
            await updateProductStatus(productId, fileType);

            notification.success({ 
                message: 'Success', 
                description: `${fileType} file uploaded successfully for ${product.ProductName}.` 
            });
            
            await fetchVendorFiles();
            await fetchAssignedProducts();
            
        } catch (error) {
            console.error('Error uploading file:', error);
            notification.error({ message: 'Error', description: 'Failed to upload file.' });
        }
        return false;
    };

    const updateProductStatus = async (productId: number, fileType: string) => {
        try {
            // Update the main product list to reflect file submission
            await sp.web.lists
                .getByTitle('Operational - Artwork Management Systems')
                .items.getById(productId)
                .update({
                    [`${fileType}Submitted`]: 'Yes',
                    [`${fileType}SubmissionDate`]: new Date().toISOString(),
                    Status: 'Under Vendor Review'
                });
        } catch (error) {
            console.error('Error updating product status:', error);
        }
    };

    const getDeadlineStatus = (deadline: string): { color: string; text: string } => {
        const deadlineDate = moment(deadline);
        const today = moment();
        const daysLeft = deadlineDate.diff(today, 'days');
        
        if (daysLeft < 0) {
            return { color: 'red', text: `Overdue by ${Math.abs(daysLeft)} days` };
        } else if (daysLeft <= 3) {
            return { color: 'orange', text: `${daysLeft} days left` };
        } else {
            return { color: 'green', text: `${daysLeft} days left` };
        }
    };

    const calculateProgress = (product: AssignedProduct): number => {
        const totalSteps = vendorWorkflowSteps.length;
        let completedSteps = 0;
        
        // Basic logic - in real implementation, this would check actual file submissions
        if (product.Status !== 'Assigned') completedSteps++;
        if (product.ArtworkFiles && product.ArtworkFiles.length > 0) completedSteps++;
        if (product.CDRFiles && product.CDRFiles.length > 0) completedSteps++;
        if (product.PackagingFiles && product.PackagingFiles.length > 0) completedSteps++;
        
        return (completedSteps / totalSteps) * 100;
    };

    React.useEffect(() => {
        void fetchVendorFiles();
        void fetchAssignedProducts();
    }, [supplierEmail]);

    const productColumns = [
        {
            title: 'Product Name',
            dataIndex: 'ProductName',
            key: 'ProductName',
            render: (text: string, record: AssignedProduct) => (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{text}</div>
                    <Tag color="blue">{record.PackingCategory}</Tag>
                </div>
            ),
        },
        {
            title: 'Status & Progress',
            key: 'progress',
            render: (_: any, record: AssignedProduct) => {
                const progress = calculateProgress(record);
                return (
                    <div>
                        <Tag color={record.Status === 'Completed' ? 'green' : 'processing'}>
                            {record.Status}
                        </Tag>
                        <Progress percent={progress} size="small" />
                    </div>
                );
            },
        },
        {
            title: 'Deadline',
            dataIndex: 'Deadline',
            key: 'Deadline',
            render: (deadline: string) => {
                const status = getDeadlineStatus(deadline);
                return (
                    <div>
                        <div>{moment(deadline).format('MMM DD, YYYY')}</div>
                        <Tag color={status.color}>{status.text}</Tag>
                    </div>
                );
            },
        },
        {
            title: 'Required Documents',
            dataIndex: 'RequiredDocuments',
            key: 'RequiredDocuments',
            render: (docs: string[]) => (
                <div>
                    {docs.slice(0, 2).map(doc => (
                        <Tag key={doc} style={{ marginBottom: 4 }}>{doc}</Tag>
                    ))}
                    {docs.length > 2 && <Tag>+{docs.length - 2} more</Tag>}
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: AssignedProduct) => (
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                    <Upload 
                        beforeUpload={(file) => handleFileUpload(file, record.ID, 'Artwork')}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined />} size="small" type="primary">
                            Upload Artwork
                        </Button>
                    </Upload>
                    <Upload 
                        beforeUpload={(file) => handleFileUpload(file, record.ID, 'CDR')}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined />} size="small">
                            Upload CDR
                        </Button>
                    </Upload>
                    <Upload 
                        beforeUpload={(file) => handleFileUpload(file, record.ID, 'Packaging')}
                        showUploadList={false}
                    >
                        <Button icon={<UploadOutlined />} size="small">
                            Upload Packaging
                        </Button>
                    </Upload>
                </div>
            ),
        },
    ];

    const fileColumns = [
        {
            title: 'Product Name',
            dataIndex: 'ProductName',
            key: 'ProductName',
        },
        {
            title: 'File Name',
            dataIndex: 'FileName',
            key: 'FileName',
            render: (text: string, record: VendorFile) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileOutlined />
                    <span>{text}</span>
                    {record.FileType && <Tag>{record.FileType}</Tag>}
                </div>
            ),
        },
        {
            title: 'Upload Date',
            dataIndex: 'UploadDate',
            key: 'UploadDate',
            render: (date: string) => moment(date).format('MMM DD, YYYY HH:mm'),
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            render: (status: string) => {
                const color = status === 'Approved' ? 'green' : 
                           status === 'Rejected' ? 'red' : 'processing';
                const icon = status === 'Approved' ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
                return <Tag color={color} icon={icon}>{status}</Tag>;
            },
        },
        {
            title: 'Remarks',
            dataIndex: 'Remarks',
            key: 'Remarks',
            ellipsis: true,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: VendorFile) => (
                <Button icon={<DownloadOutlined />} size="small">
                    Download
                </Button>
            ),
        },
    ];

    const pendingCount = assignedProducts.filter(p => p.Status !== 'Completed').length;
    const overdueCount = assignedProducts.filter(p => 
        moment(p.Deadline).isBefore(moment()) && p.Status !== 'Completed'
    ).length;

    return (
        <div style={{ padding: '20px' }}>
            <Row gutter={16} style={{ marginBottom: '20px' }}>
                <Col span={24}>
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>Vendor Dashboard</h2>
                                <p style={{ margin: 0, color: '#666' }}>Welcome, {supplierEmail}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                                        {assignedProducts.length}
                                    </div>
                                    <div>Total Products</div>
                                </div>
                                <Divider type="vertical" style={{ height: 40 }} />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                                        {pendingCount}
                                    </div>
                                    <div>Pending</div>
                                </div>
                                <Divider type="vertical" style={{ height: 40 }} />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                                        {overdueCount}
                                    </div>
                                    <div>Overdue</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane 
                    tab={
                        <span>
                            <ClockCircleOutlined />
                            Assigned Products
                            {pendingCount > 0 && <Badge count={pendingCount} style={{ marginLeft: 8 }} />}
                        </span>
                    } 
                    key="products"
                >
                    <Card title="Product Assignments & Submissions">
                        <Table 
                            dataSource={assignedProducts} 
                            columns={productColumns} 
                            rowKey="ID"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            expandable={{
                                expandedRowRender: (record) => (
                                    <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                                        <h4>Vendor Workflow Progress</h4>
                                        <Steps size="small" current={Math.floor(calculateProgress(record) / 16.67)}>
                                            {vendorWorkflowSteps.map((step, index) => (
                                                <Step key={index} title={step} />
                                            ))}
                                        </Steps>
                                        <div style={{ marginTop: '16px' }}>
                                            <h4>Required Documents Checklist:</h4>
                                            {record.RequiredDocuments.map(doc => (
                                                <div key={doc} style={{ marginBottom: '8px' }}>
                                                    <CheckCircleOutlined style={{ color: 'green', marginRight: '8px' }} />
                                                    {doc}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            }}
                        />
                    </Card>
                </TabPane>

                <TabPane 
                    tab={
                        <span>
                            <FileOutlined />
                            File History
                        </span>
                    } 
                    key="files"
                >
                    <Card title="Uploaded Files History">
                        <Table 
                            dataSource={vendorFiles} 
                            columns={fileColumns} 
                            rowKey="ID"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </TabPane>
            </Tabs>
        </div>
    );
};

export default VendorDashboard;
