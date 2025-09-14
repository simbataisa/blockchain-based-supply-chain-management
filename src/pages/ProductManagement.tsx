import React, { useState, useEffect } from "react";
import { useSupplyChain } from "../contexts/SupplyChainContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import QRCodeGenerator from "../components/QRCodeGenerator";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import CreateProductModal from "../components/CreateProductModal";
import ProductDetailsModal from "../components/ProductDetailsModal";
import ProductEditModal from "../components/ProductEditModal";
import QualityModal from "../components/QualityModal";
import BulkActionsBar from "../components/BulkActionsBar";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  batch_number: string;
  manufacturer_id: string;
  current_owner_id: string;
  status: "created" | "in_transit" | "delivered" | "verified" | "recalled";
  origin_location: string;
  current_location: string;
  created_at: Date;
  updated_at: Date;
  metadata?: {
    weight?: string;
    dimensions?: string;
    lot_number?: string;
    supplier_info?: {
      name?: string;
      contact?: string;
      certification?: string;
    };
    [key: string]: any;
  };
  certifications?: string[];
  qr_code_data?: string;
}

const ProductManagement: React.FC = () => {
  const { products, updateProduct, deleteProduct } = useSupplyChain();
  const { user } = useAuth();

  // State management
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [selectedProductForQR, setSelectedProductForQR] =
    useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeView, setActiveView] = useState<"products" | "analytics">(
    "products"
  );

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Bulk operations
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  // Import functionality
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Product[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Create product form
  const [createStep, setCreateStep] = useState(1);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "electronics",
    sku: "",
    batch_number: "",
    origin_location: "",
    current_location: "",
    metadata: {
      weight: "",
      dimensions: "",
      lot_number: "",
      supplier_info: {
        name: "",
        contact: "",
        certification: "",
      },
    },
  });

  const categories = [
    "electronics",
    "food",
    "pharmaceuticals",
    "automotive",
    "textiles",
    "other",
  ];
  const statuses = [
    "created",
    "in_transit",
    "delivered",
    "verified",
    "recalled",
  ];

  // Enhanced filtering logic
  const filteredProducts = products.filter((product) => {
    // Enhanced search - includes metadata search
    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.origin_location
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.current_location
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.metadata as any)?.lot_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.metadata as any)?.supplier_info?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || product.status === filterStatus;
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;

    // Location filter
    const matchesLocation =
      filterLocation === "all" ||
      product.current_location
        .toLowerCase()
        .includes(filterLocation.toLowerCase()) ||
      product.origin_location
        .toLowerCase()
        .includes(filterLocation.toLowerCase());

    // Date range filter
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      const productDate = new Date(product.created_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDateRange = productDate >= startDate && productDate <= endDate;
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesLocation &&
      matchesDateRange
    );
  }) as Product[];

  // Sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: string | number | Date = a[sortBy as keyof Product] as
      | string
      | number
      | Date;
    let bValue: string | number | Date = b[sortBy as keyof Product] as
      | string
      | number
      | Date;

    if (sortBy === "created_at" || sortBy === "updated_at") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Product management functions
  const handleCreateProduct = async (productData: Partial<Product>) => {
    try {
      const product = {
        ...productData,
        id: Date.now().toString(),
        manufacturer_id: user?.id || "",
        current_owner_id: user?.id || "",
        status: "created",
        created_at: new Date(),
        updated_at: new Date(),
        metadata: productData.metadata || {},
      };

      // Note: addProduct method needs to be implemented in SupplyChainContext
      console.log("Product to be added:", product);
      setShowCreateModal(false);
      resetNewProduct();
      toast.success("Product created successfully!");
    } catch {
      toast.error("Failed to create product");
    }
  };

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    try {
      const updatedProduct = {
        ...productData,
        updated_at: new Date(),
      };
      await updateProduct(updatedProduct.id, updatedProduct);
      setShowEditModal(false);
      setEditingProduct(null);
      toast.success("Product updated successfully!");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);
        toast.success("Product deleted successfully!");
      } catch {
        toast.error("Failed to delete product");
      }
    }
  };

  const resetNewProduct = () => {
    setNewProduct({
      name: "",
      description: "",
      category: "electronics",
      sku: "",
      batch_number: "",
      origin_location: "",
      current_location: "",
      metadata: {
        weight: "",
        dimensions: "",
        lot_number: "",
        supplier_info: {
          name: "",
          contact: "",
          certification: "",
        },
      },
    });
    setCreateStep(1);
  };

  // Selection functions
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(filteredProducts.map((p) => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // Bulk operations
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      toast.error("No products selected");
      return;
    }

    try {
      switch (action) {
        case "delete":
          if (window.confirm(`Delete ${selectedProducts.length} products?`)) {
            for (const productId of selectedProducts) {
              await deleteProduct(productId);
            }
            toast.success(`${selectedProducts.length} products deleted`);
            clearSelection();
          }
          break;
        case "export": {
          const selectedProductsData = products.filter((p) =>
            selectedProducts.includes(p.id)
          );
          const dataStr = JSON.stringify(selectedProductsData, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "selected_products.json";
          link.click();
          toast.success("Products exported successfully");
          break;
        }
        default:
          toast.error("Unknown action");
      }
    } catch {
      toast.error("Bulk operation failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your supply chain products
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                <button
                  onClick={() => setActiveView("products")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === "products"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveView("analytics")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === "analytics"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Analytics
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>

        {activeView === "products" ? (
          <>
            {/* Filters */}
            <ProductFilters
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              filterCategory={filterCategory}
              filterLocation={filterLocation}
              filterDateRange={dateRange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              advancedFiltersOpen={false}
              categories={categories}
              selectedProducts={selectedProducts}
              onSearchChange={setSearchTerm}
              onStatusFilterChange={setFilterStatus}
              onCategoryFilterChange={setFilterCategory}
              onLocationFilterChange={setFilterLocation}
              onDateRangeChange={setDateRange}
              onSortChange={(sortBy, sortOrder) => {
                setSortBy(sortBy);
                setSortOrder(sortOrder);
              }}
              onAdvancedFiltersToggle={() => {}}
              onClearAdvancedFilters={() => {}}
              onBatchAction={() => {}}
            />

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <BulkActionsBar
                {...({
                  selectedCount: selectedProducts.length,
                  onClearSelection: clearSelection,
                  onBulkAction: handleBulkAction,
                } as any)}
              />
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as any}
                  selectedProducts={selectedProducts}
                  statusConfig={{
                    created: { icon: Package, color: "blue" },
                    in_transit: { icon: Truck, color: "yellow" },
                    delivered: { icon: CheckCircle, color: "green" },
                    verified: { icon: CheckCircle, color: "green" },
                    recalled: { icon: AlertTriangle, color: "red" },
                  }}
                  onToggleSelection={() => toggleProductSelection(product.id)}
                  onEdit={() => {
                    setEditingProduct(product);
                    setShowEditModal(true);
                  }}
                  onView={() => {
                    setViewingProduct(product);
                    setShowDetailModal(true);
                  }}
                  onQuality={() => {
                    setViewingProduct(product);
                    setShowQualityModal(true);
                  }}
                  onQRCode={() => {
                    setSelectedProductForQR(product);
                    setShowQRGenerator(true);
                  }}
                  onDelete={() => handleDeleteProduct(product.id)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search or filter criteria.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Product
                </button>
              </div>
            )}
          </>
        ) : (
          <AnalyticsDashboard products={products as any} />
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateProductModal
            {...({
              isOpen: showCreateModal,
              onClose: () => {
                setShowCreateModal(false);
                resetNewProduct();
              },
              onSubmit: handleCreateProduct,
              categories: categories,
              newProduct: newProduct,
              onProductChange: setNewProduct,
            } as any)}
          />
        )}

        {showDetailModal && viewingProduct && (
          <ProductDetailsModal
            {...({
              isOpen: showDetailModal,
              onClose: () => {
                setShowDetailModal(false);
                setViewingProduct(null);
              },
              product: viewingProduct,
              onEdit: () => {
                setEditingProduct(viewingProduct);
                setShowEditModal(true);
              },
              onQualityRecords: () => {},
            } as any)}
          />
        )}

        {showEditModal && editingProduct && (
          <ProductEditModal
            {...({
              isOpen: showEditModal,
              onClose: () => {
                setShowEditModal(false);
                setEditingProduct(null);
              },
              product: editingProduct,
              onSubmit: handleUpdateProduct,
              onChange: () => {},
            } as any)}
          />
        )}

        {showQualityModal && viewingProduct && (
          <QualityModal
            isOpen={showQualityModal}
            onClose={() => {
              setShowQualityModal(false);
              setViewingProduct(null);
            }}
            product={viewingProduct as any}
          />
        )}

        {showQRGenerator && selectedProductForQR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">QR Code</h3>
                <button
                  onClick={() => {
                    setShowQRGenerator(false);
                    setSelectedProductForQR(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <QRCodeGenerator data={selectedProductForQR?.id || ""} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
