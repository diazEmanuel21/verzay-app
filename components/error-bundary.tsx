"use client";

import React from "react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: any) {
        if (error?.name === "ChunkLoadError") {
            // delega en ChunkRecovery; aquí solo marcas estado
        }
    }
    render() {
        if (this.state.hasError) return <div>Actualizando la aplicación…</div>;
        return this.props.children;
    }
}

export default ErrorBoundary;
