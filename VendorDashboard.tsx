/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-void */
import * as React from 'react';
import { Table, Upload, Button, notification } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { sp } from '@pnp/sp/presets/all';

interface VendorFile {
    ID: number;
    ProductName: string;
    FileName: string;
    Status: string;
    Remarks?: string;
}

const VendorDashboard = ({ supplierEmail }: { supplierEmail: string }): JSX.Element => {
    const [vendorFiles, setVendorFiles] = React.useState<VendorFile[]>([]);

    const fetchVendorFiles = async (): Promise<void> => {
        try {
            const listName = 'Vendor Files';
            const items = await sp.web.lists
                .getByTitle(listName)
                .items.filter(`SupplierEmail eq '${supplierEmail}'`)
                .select('ID, ProductName, FileName, Status, Remarks')
                .get();
            setVendorFiles(items);
        } catch (error) {
            console.error('Error fetching vendor files:', error);
            notification.error({ message: 'Error', description: 'Failed to fetch vendor files.' });
        }
    };

    const handleFileUpload = async (file: File, productName: string): Promise<boolean> => {
        try {
            const folderPath = `VendorFiles/${supplierEmail}/${productName}`;
            const uploadResult = await sp.web.getFolderByServerRelativeUrl(folderPath).files.add(file.name, file, true);

            // Update the external SharePoint list with the uploaded file details
            const fileItem = await uploadResult.file.getItem();
            await fileItem.update({
                SupplierEmail: supplierEmail,
                ProductName: productName,
                FileName: file.name,
                Status: 'Pending',
            });

            notification.success({ message: 'Success', description: 'File uploaded successfully.' });
            void fetchVendorFiles();
        } catch (error) {
            console.error('Error uploading file:', error);
            notification.error({ message: 'Error', description: 'Failed to upload file.' });
        }
        return false;
    };

    React.useEffect(() => {
        void fetchVendorFiles();
    }, [supplierEmail]);

    const columns = [
        { title: 'Product Name', dataIndex: 'ProductName', key: 'ProductName' },
        { title: 'File Name', dataIndex: 'FileName', key: 'FileName' },
        { title: 'Status', dataIndex: 'Status', key: 'Status' },
        { title: 'Remarks', dataIndex: 'Remarks', key: 'Remarks' },
        {
            title: 'Actions',
            key: 'Actions',
            render: (_: any, record: { ProductName: string; }) => (
                <Upload beforeUpload={(file) => handleFileUpload(file, record.ProductName)}>
                    <Button icon={<UploadOutlined />}>Upload File</Button>
                </Upload>
            ),
        },
    ];

    return <Table dataSource={vendorFiles} columns={columns} rowKey="ID" />;
};

export default VendorDashboard;
