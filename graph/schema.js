
import QueryRoot from "./types/query-root";
import Shop from "./types/shop";
import Address from "./types/address";
import Domain from "./types/domain";
import CollectionConnection from "./types/collection-connection";
import PageInfo from "./types/page-info";
import CollectionEdge from "./types/collection-edge";
import Collection from "./types/collection";
import ProductConnection from "./types/product-connection";
import ProductEdge from "./types/product-edge";
import Product from "./types/product";
import ImageConnection from "./types/image-connection";
import ImageEdge from "./types/image-edge";
import Image from "./types/image";
import ProductOption from "./types/product-option";
import ProductVariantConnection from "./types/product-variant-connection";
import ProductVariantEdge from "./types/product-variant-edge";
import ProductVariant from "./types/product-variant";
import SelectedOption from "./types/selected-option";
const Schema = {};
Schema["QueryRoot"] = QueryRoot;
Schema["Shop"] = Shop;
Schema["Address"] = Address;
Schema["Domain"] = Domain;
Schema["CollectionConnection"] = CollectionConnection;
Schema["PageInfo"] = PageInfo;
Schema["CollectionEdge"] = CollectionEdge;
Schema["Collection"] = Collection;
Schema["ProductConnection"] = ProductConnection;
Schema["ProductEdge"] = ProductEdge;
Schema["Product"] = Product;
Schema["ImageConnection"] = ImageConnection;
Schema["ImageEdge"] = ImageEdge;
Schema["Image"] = Image;
Schema["ProductOption"] = ProductOption;
Schema["ProductVariantConnection"] = ProductVariantConnection;
Schema["ProductVariantEdge"] = ProductVariantEdge;
Schema["ProductVariant"] = ProductVariant;
Schema["SelectedOption"] = SelectedOption;
export default Object.freeze(Schema);