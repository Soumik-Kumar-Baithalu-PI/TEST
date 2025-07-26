/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useState } from 'react';
import { Card, Form, Row, Col, Upload, Button, Table, Select, notification, Progress } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { sp } from '@pnp/sp/presets/all';

const MarketingServicesTask = ({ productId }: { productId: any , onCDRSubmit?: () => Promise<void>; }): JSX.Element => {
    interface LanguageTranslation {
        Language: string;
        Status: 'Pending' | 'Completed';
    }

    const [languageTranslations, setLanguageTranslations] = useState<LanguageTranslation[]>([]);
    const [finalPackagingFiles, setFinalPackagingFiles] = useState<any[]>([]);
    const [cdrFiles, setCdrFiles] = useState<any[]>([]);
    const [, setApprovalStatus] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [, setLoading] = useState<boolean>(false);
    const [finalPackagingUploadProgress, setFinalPackagingUploadProgress] = useState<number>(0);
    const [cdrUploadProgress, setCdrUploadProgress] = useState<number>(0);
    const [finalPackagingUploading, setFinalPackagingUploading] = useState<boolean>(false);
    const [cdrUploading, setCdrUploading] = useState<boolean>(false);

    const predefinedLanguages: LanguageTranslation[] = [
        { Language: 'Hindi', Status: 'Pending' },
        { Language: 'Bengali', Status: 'Pending' },
        { Language: 'Marathi', Status: 'Pending' },
        { Language: 'Telugu', Status: 'Pending' },
        { Language: 'Tamil', Status: 'Pending' },
        { Language: 'Gujarati', Status: 'Pending' },
        { Language: 'Urdu', Status: 'Pending' },
        { Language: 'Kannada', Status: 'Pending' },
        { Language: 'Odia', Status: 'Pending' },
        { Language: 'Malayalam', Status: 'Pending' },
        { Language: 'Punjabi', Status: 'Pending' },
        { Language: 'Assamese', Status: 'Pending' },
        { Language: 'English', Status: 'Pending' },
    ];

    // Fetch language translations from SharePoint list
    const fetchLanguageTranslations = async (): Promise<void> => {
        if (!productId) return;
        try {
            const listName = 'Master - Language Translations';
            const items = await sp.web.lists
                .getByTitle(listName)
                .items.filter(`ProductID eq '${productId.toString()}'`) 
                .select('Language, LanguageTranslationStatus') 
                .get();

            const translations = items.map(item => ({
                Language: item.Language,
                Status: item.LanguageTranslationStatus, // Use the correct column name
            }));

            // Merge predefined languages with fetched translations
            const mergedTranslations = predefinedLanguages.map(predefined => {
                const existingTranslation = translations.find(
                    translation => translation.Language === predefined.Language
                );
                return existingTranslation || predefined;
            });

            setLanguageTranslations(mergedTranslations);
        } catch (error) {
            console.error('Error fetching language translations:', error);
            notification.warning({
                message: 'Warning',
                description: 'No language translations found. You can update the status manually.',
            });

            // Enable the table with predefined languages if no translations are found
            setLanguageTranslations(predefinedLanguages);
        }
    };

    // Update language translation status in SharePoint list
    const updateLanguageTranslationStatus = async (language: string, status: 'Pending' | 'Completed'): Promise<void> => {
        if (!productId) return;
        try {
            const listName = 'Master - Language Translations';
            const item = await sp.web.lists
                .getByTitle(listName)
                .items.filter(`ProductID eq '${productId.toString()}' and Language eq '${language}'`) // Convert ProductID to string and wrap in quotes
                .get();

            if (item.length > 0) {
                await sp.web.lists.getByTitle(listName).items.getById(item[0].Id).update({
                    Status: status,
                });
            } else {
                await sp.web.lists.getByTitle(listName).items.add({
                    ProductID: productId.toString(), // Ensure ProductID is stored as a string
                    Language: language,
                    LanguageTranslationStatus: status,
                });
            }

            notification.success({
                message: 'Success',
                description: `Language translation status updated for ${language}.`,
            });
        } catch (error) {
            console.error('Error updating language translation status:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to update language translation status. Please try again.',
            });
        }
    };

    const handleLanguageStatusChange = (value: 'Pending' | 'Completed', record: LanguageTranslation) => {
        setLanguageTranslations(translations =>
            translations.map(item =>
                item.Language === record.Language ? { ...item, Status: value } : item
            )
        );
        updateLanguageTranslationStatus(record.Language, value).catch(error =>
            console.error('Error in updateLanguageTranslationStatus:', error)
        );
    };



    const handleSubmitApproval = async (): Promise<void> => {
        try {
            if (finalPackagingFiles.length === 0) {
                notification.error({
                    message: 'Error',
                    description: 'Please upload the final packaging artwork before submitting for approval.',
                });
                return;
            }

            const listName = 'Operational - Artwork Management Systems';

            // Update the SharePoint list with approval status
            await sp.web.lists.getByTitle(listName).items.getById(productId).update({
                Status: 'Final Artwork File Uploaded', // Update the status
                FinalPackagingArtworkStatusStatus: 'Pending',
                RunWF: "Yes",
            });

            notification.success({
                message: 'Success',
                description: 'Final packaging artwork submitted for approval successfully.',
            });
            setApprovalStatus('Pending');
        } catch (error) {
            console.error('Error submitting for approval:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to submit final artwork for approval. Please try again.',
            });
        }
    };

    // Fetch uploaded files for final packaging and CDR
    const fetchUploadedFiles = React.useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        try {
            const finalPackagingFiles = await sp.web
                .getFolderByServerRelativeUrl('ArtworkLibrary/PackagingArtwork')
                .files.select('Name', 'ServerRelativeUrl', 'UniqueId', 'ListItemAllFields/DocID')
                .expand('ListItemAllFields')
                .filter(`ListItemAllFields/DocID eq ${productId}`)
                .get();
            setFinalPackagingFiles(finalPackagingFiles);

            const cdrFiles = await sp.web
                .getFolderByServerRelativeUrl('ArtworkLibrary/CDR')
                .files.select('Name', 'ServerRelativeUrl', 'UniqueId', 'ListItemAllFields/DocID')
                .expand('ListItemAllFields')
                .filter(`ListItemAllFields/DocID eq ${productId}`)
                .get();
            setCdrFiles(cdrFiles);
        } catch (error) {
            console.error('Error fetching uploaded files:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to fetch uploaded files. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const handleLargeFileUploadWithProgress = async (
        file: File,
        folderPath: string,
        setUploading: React.Dispatch<React.SetStateAction<boolean>>,
        setProgress: React.Dispatch<React.SetStateAction<number>>
    ): Promise<boolean> => {
        if (!productId) {
            notification.error({ message: 'Error', description: 'Product ID missing.' });
            return false;
        }
        setUploading(true);
        setProgress(0);

        const retryWithBackoff = async (operation: () => Promise<void>, retries: number = 5, delay: number = 1000): Promise<void> => {
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    await operation();
                    return;
                } catch (error: any) {
                    if (error.statusCode === 429 && attempt < retries - 1) {
                        const backoffDelay = delay * Math.pow(2, attempt); // Exponential backoff
                        console.warn(`Retrying after ${backoffDelay}ms due to throttling...`);
                        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
                    } else {
                        throw error;
                    }
                }
            }
        };

        try {
            const fileUpload = sp.web.getFolderByServerRelativeUrl(folderPath).files;

            await retryWithBackoff(async () => {
                await fileUpload.addChunked(
                    file.name,
                    file,
                    (data) => {
                        const progress = Math.round((data.blockNumber / data.totalBlocks) * 100);
                        setProgress(progress);
                    }
                );
            });

            const fileItem = await sp.web.getFolderByServerRelativeUrl(folderPath).files.getByName(file.name).getItem();
            await fileItem.update({ DocID: productId.toString() });

            notification.success({
                message: 'Success',
                description: `${file.name} uploaded successfully.`,
            });
            await fetchUploadedFiles();
        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            notification.error({
                message: 'Error',
                description: `Failed to upload ${file.name}. Please try again.`,
            });
        } finally {
            setUploading(false);
            setProgress(0);
        }
        return false;
    };

    const handleFinalPackagingUpload = async (file: File): Promise<boolean> => {
        const folderPath = 'ArtworkLibrary/PackagingArtwork';
        return handleLargeFileUploadWithProgress(
            file,
            folderPath,
            setFinalPackagingUploading,
            setFinalPackagingUploadProgress
        );
    };

    const handleCDRUpload = async (file: File): Promise<boolean> => {
        const folderPath = 'ArtworkLibrary/CDR';
        return handleLargeFileUploadWithProgress(file, folderPath, setCdrUploading, setCdrUploadProgress);
    };

    const fileColumns = [
        {
            title: 'File Name',
            dataIndex: 'Name',
            key: 'Name',
            render: (text: string, record: any) => (
                <a href={record.ServerRelativeUrl} target="_blank" rel="noopener noreferrer">
                    {text}
                </a>
            ),
        },
        {
            title: 'Actions',
            key: 'Actions',
            render: (_: any, record: any) => (
                <a href={record.ServerRelativeUrl} target="_blank" rel="noopener noreferrer">
                    Download
                </a>
            ),
        },
    ];

    React.useEffect(() => {
        fetchLanguageTranslations().catch(error =>
            console.error('Error in fetchLanguageTranslations:', error)
        );
    }, [productId]);

    React.useEffect(() => {
        fetchUploadedFiles().catch((error) =>
            console.error('Error in fetchUploadedFiles:', error)
        );
    }, [fetchUploadedFiles]);

    // Define columns for the language translations table
    const languageColumns = [
        {
            title: 'Language',
            dataIndex: 'Language',
            key: 'Language',
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            render: (text: 'Pending' | 'Completed', record: LanguageTranslation) => (
                <Select
                    value={text}
                    style={{ width: 120 }}
                    onChange={(value) => handleLanguageStatusChange(value, record)}
                >
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Completed">Completed</Select.Option>
                </Select>
            ),
        },
    ];

    return (
        <Card title="Marketing Services Task" style={{ marginTop: 24 }}>
            <Form layout="vertical">
                {/* Language Translations Table */}
                <Row gutter={16}>
                    <Col span={24}>
                        <Card
                            title="Language Translations"
                            size="small"
                            bodyStyle={{ padding: 0 }}
                        >
                            <Table
                                dataSource={languageTranslations}
                                columns={languageColumns}
                                rowKey="Language"
                                pagination={false}
                                bordered
                                size="small"
                                locale={{
                                    emptyText: 'No translations available. Please add translations in the SharePoint list.',
                                }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Final Packaging Artwork Upload */}
                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Form.Item label="Final Packaging Artwork" name="FinalPackagingArtworkStatus">
                            <Upload
                                beforeUpload={handleFinalPackagingUpload}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />}>Upload Final Packaging Artwork</Button>
                            </Upload>
                            {finalPackagingUploading && (
                                <Progress percent={finalPackagingUploadProgress} status="active" style={{ marginTop: 8, width: '20%',left:'2%' }} />
                            )}
                            {finalPackagingFiles.length > 0 && (
                                <Table
                                    dataSource={finalPackagingFiles}
                                    columns={fileColumns}
                                    rowKey="UniqueId"
                                    pagination={false}
                                    bordered
                                    size="small"
                                    locale={{ emptyText: 'No files uploaded.' }}
                                    style={{ marginTop: 16 }}
                                />
                            )}
                        </Form.Item>
                    </Col>
                </Row>

                {/* CDR File Upload */}
                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Form.Item label="CDR Files" name="cdrFiles">
                            <Upload
                                beforeUpload={handleCDRUpload}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />}>Upload CDR File</Button>
                            </Upload>
                            {cdrUploading && (
                                <Progress percent={cdrUploadProgress} status="active" style={{ marginTop: 8, width: '50%' }} />
                            )}
                            {cdrFiles.length > 0 && (
                                <Table
                                    dataSource={cdrFiles}
                                    columns={fileColumns}
                                    rowKey="UniqueId"
                                    pagination={false}
                                    bordered
                                    size="small"
                                    locale={{ emptyText: 'No files uploaded.' }}
                                    style={{ marginTop: 16 }}
                                />
                            )}
                        </Form.Item>
                    </Col>
                </Row>

                {/* Submit for Approval Button */}
                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Button type="primary" onClick={handleSubmitApproval}>
                            Submit for Approval
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default MarketingServicesTask;