/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useState } from "react";
import { Form, Input, Select, Button, Row, Col, notification } from "antd";
import { sp } from "@pnp/sp/presets/all";

const { Option } = Select;

interface SCMFormProps {
  initialValues?: {
    productCategories: string;
    productName: string;
    mopPackSize: string;
  };
}

const SCMForm: React.FC<SCMFormProps> = ({ initialValues }) => {
  const [packingMaterialCategories] = useState([
    "BOP TAPE",
    "LABEL",
    "LDPE SHRINK",
    "LEAFLET",
    "MONOCARTON",
    "NECK TIE",
    "POUCH",
    "SHIPPER BOX",
    "SHIPPER LABEL",
  ]);
  const [supplierOptions, setSupplierOptions] = useState<string[]>([]);
  const [supplierNameOptions, setSupplierNameOptions] = useState<string[]>([]);

  const fetchSuppliers = async (category: string) => {
    try {
      const listName = "Vendor List";

      const items = await sp.web.lists
        .getByTitle(listName)
        .items.filter(`PackingMaterialCategory eq '${category}'`)
        .select("Supplier, SupplierName")
        .get();

      setSupplierOptions(items.map((item) => item.Supplier));
      setSupplierNameOptions(items.map((item) => item.SupplierName));
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch suppliers. Please try again.",
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    fetchSuppliers(category).catch((error) =>
      console.error("Error in fetchSuppliers:", error)
    );
  };

  const handleSubmit = (values: any) => {
    console.log("Form Submitted:", values);
  };

  return (
    <Form
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={initialValues} // Use initialValues directly
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Product Categories (Brand Name)"
            name="productCategories"
            rules={[{ required: true, message: "Please enter the product category!" }]}
          >
            <Input placeholder="Enter Product Category" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Product Name"
            name="productName"
            rules={[{ required: true, message: "Please enter the product name!" }]}
          >
            <Input placeholder="Enter Product Name" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="MOP Pack Size"
            name="mopPackSize"
            rules={[{ required: true, message: "Please enter the MOP pack size!" }]}
          >
            <Input placeholder="Enter MOP Pack Size" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Packing Material Categories"
            name="packingMaterialCategories"
            rules={[{ required: true, message: "Please select a packing material category!" }]}
          >
            <Select
              placeholder="Select Packing Material Category"
              onChange={handleCategoryChange}
            >
              {packingMaterialCategories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Supplier"
            name="supplier"
            rules={[{ required: true, message: "Please select a supplier!" }]}
          >
            <Select placeholder="Select Supplier">
              {supplierOptions.map((supplier) => (
                <Option key={supplier} value={supplier}>
                  {supplier}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Supplier Name"
            name="supplierName"
            rules={[{ required: true, message: "Please select a supplier name!" }]}
          >
            <Select placeholder="Select Supplier Name">
              {supplierNameOptions.map((supplierName) => (
                <Option key={supplierName} value={supplierName}>
                  {supplierName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" htmlType="submit">
        Submit
      </Button>
    </Form>
  );
};

export default SCMForm;

