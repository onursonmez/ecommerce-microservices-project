// User types
export interface User {
    id: number;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

// Product types
export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
}

// Cart types
export interface Cart {
    id: number;
    userId: number;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CartItem {
    id: number;
    cartId: number;
    productId: number;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

// Order types
export interface Order {
    id: number;
    userId: number;
    status: OrderStatus;
    total: number;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    id: number;
    orderId: number;
    productId: number;
    quantity: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}