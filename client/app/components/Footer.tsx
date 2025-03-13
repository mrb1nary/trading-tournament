// components/Footer.tsx
import React from "react";
import { FaTelegramPlane, FaTwitter } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        {/* Left Section */}
        <div style={styles.leftSection}>
          <h3 style={styles.title}>klash.fun</h3>
          <p style={styles.subtitle}>
            Solana&apos;s first CryptoTrading Competition platform
          </p>
          <button style={styles.button}>POWERED BY SOLSCAN</button>
        </div>

        {/* Middle Section */}
        <div style={styles.middleSection}>
          <h4 style={styles.heading}>Ressource</h4>
          <ul style={styles.list}>
            <li>Contact</li>
            <li>Documentation</li>
            <li>Press</li>
            <li>Roadmap</li>
            <li>Term of Service</li>
            <li>Privacy</li>
          </ul>
        </div>

        {/* Right Section */}
        <div style={styles.rightSection}>
          <h4 style={styles.heading}>Follow us</h4>
          <div style={styles.icons}>
            {/* Icons for social links */}
            <FaTelegramPlane size={24} style={styles.icon} />
            <FaTwitter size={24} style={styles.icon} />
          </div>
          <p style={styles.supportText}>For any support: contact@ribbit.com</p>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: "#2F4F2F",
    color: "white",
    padding: "40px 20px",
    fontFamily: "'Roboto', sans-serif",
  },
  container: {
    display: "flex",
    justifyContent: "space-between",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  leftSection: {
    flex: 1,
  },
  middleSection: {
    flex: 1,
    textAlign: "center" as const,
  },
  rightSection: {
    flex: 1,
    textAlign: "right" as const,
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "14px",
    fontWeight: 400,
    marginBottom: "20px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#fff",
    color: "#2F4F2F",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
  },
  heading: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "10px",
  },
  list: {
    listStyleType: "none" as const,
    paddingLeft: "0",
    lineHeight: "1.8",
    fontWeight: 400,
  },
  icons: {
    display: "flex",
    justifyContent: "flex-end" as const,
    gap: "10px",
  },
  icon: {
    color: "#fff",
    cursor: "pointer",
  },
  supportText: {
    marginTop: "10px",
    fontSize: "12px",
    fontWeight: 400,
  },
};

export default Footer;
