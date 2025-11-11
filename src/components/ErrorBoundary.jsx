import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
    this.setState({ error, info });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#fff", background: "#600" }}>
          <h2>Error en GameBoard (debug)</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#fff" }}>
            {this.state.error?.toString()}
            {"\n\n"}
            {this.state.info?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}