import { useEffect, useState } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { getCertificates, getCertificateMilestone } from '../utils/contractHelpers'
import { CONTRACT_ADDRESSES } from '../config/contracts'

const CERTIFICATE_NAMES = {
  1: '5 Challenges Completed',
  2: '10 Challenges Completed',
  3: '20 Challenges Completed',
}

function CertificateDisplay() {
  const { address } = useAccount()
  const config = useConfig()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCert, setExpandedCert] = useState(null)

  useEffect(() => {
    if (address && CONTRACT_ADDRESSES.CERTIFICATE && CONTRACT_ADDRESSES.CERTIFICATE !== '0x0000000000000000000000000000000000000000') {
      loadCertificates()
    } else {
      setLoading(false)
    }
  }, [address, config])

  const loadCertificates = async () => {
    try {
      if (!address || !CONTRACT_ADDRESSES.CERTIFICATE || CONTRACT_ADDRESSES.CERTIFICATE === '0x0000000000000000000000000000000000000000') {
        setLoading(false)
        return
      }

      const tokenIds = await getCertificates(config, CONTRACT_ADDRESSES.CERTIFICATE, address)
      const certs = []
      
      for (const tokenId of tokenIds) {
        try {
          const milestone = await getCertificateMilestone(config, CONTRACT_ADDRESSES.CERTIFICATE, Number(tokenId))
          certs.push({
            tokenId: Number(tokenId),
            milestone: Number(milestone),
            name: CERTIFICATE_NAMES[Number(tokenId)] || `${milestone} Challenges Completed`,
          })
        } catch (error) {
          console.error(`Failed to load certificate ${tokenId}:`, error)
        }
      }
      
      setCertificates(certs)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load certificates:', error)
      setLoading(false)
    }
  }

  if (!address) {
    return null
  }

  if (CONTRACT_ADDRESSES.CERTIFICATE === '0x0000000000000000000000000000000000000000') {
    return null
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>CERTIFICATES</div>
        <div style={styles.loading}>Loading...</div>
      </div>
    )
  }

  if (certificates.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>CERTIFICATES</div>
        <div style={styles.empty}>No certificates yet. Complete challenges to earn certificates!</div>
      </div>
    )
  }

  const handleCertificateClick = (cert) => {
    setExpandedCert(expandedCert === cert.tokenId ? null : cert.tokenId)
  }

  const getPolygonscanUrl = (tokenId) => {
    return `https://amoy.polygonscan.com/nft/${CONTRACT_ADDRESSES.CERTIFICATE}/${tokenId}`
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>CERTIFICATES</div>
      <div style={styles.grid}>
        {certificates.map((cert) => (
          <div key={cert.tokenId} style={styles.certificateWrapper}>
            <div 
              style={styles.certificate}
              onClick={() => handleCertificateClick(cert)}
            >
              {cert.tokenId === 1 && (
                <div style={styles.sigil}>
                  {`┌──┼──┐
▼  ▼  ▼
╲│╱
V`}
                </div>
              )}
              <div style={styles.certificateName}>{cert.milestone} CHALLENGES COMPLETED</div>
              <div style={styles.clickHint}>Click to view import details</div>
            </div>
            {expandedCert === cert.tokenId && (
              <div style={styles.importInfo}>
                <div style={styles.importTitle}>Import to MetaMask</div>
                <div style={styles.importStep}>
                  <div style={styles.stepLabel}>1. Open MetaMask → NFTs tab</div>
                </div>
                <div style={styles.importStep}>
                  <div style={styles.stepLabel}>2. Click "Import NFT"</div>
                </div>
                <div style={styles.importStep}>
                  <div style={styles.stepLabel}>3. Enter these details:</div>
                  <div style={styles.importDetails}>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Contract Address:</span>
                      <span style={styles.detailValue}>{CONTRACT_ADDRESSES.CERTIFICATE}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Token ID:</span>
                      <span style={styles.detailValue}>{cert.tokenId}</span>
                    </div>
                  </div>
                </div>
                <div style={styles.importStep}>
                  <div style={styles.stepLabel}>4. Click "Import"</div>
                </div>
                <div style={styles.polygonscanLink}>
                  <a 
                    href={getPolygonscanUrl(cert.tokenId)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    View on Polygonscan →
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'monospace',
    borderTop: '2px solid #ffffff',
    marginTop: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    borderBottom: '2px solid #ff0000',
    paddingBottom: '12px',
  },
  loading: {
    textAlign: 'center',
    color: '#ffffff',
    padding: '16px',
  },
  empty: {
    textAlign: 'center',
    color: '#ffffff',
    padding: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  certificateWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  certificate: {
    border: '2px solid #ff0000',
    padding: '16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'monospace',
    minHeight: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  sigil: {
    fontSize: '14px',
    lineHeight: '1.2',
    color: '#ff0000',
    marginBottom: '12px',
    textAlign: 'center',
    whiteSpace: 'pre',
    fontFamily: 'monospace',
  },
  certificateName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '8px',
  },
  clickHint: {
    fontSize: '12px',
    color: '#888888',
    fontStyle: 'italic',
  },
  importInfo: {
    border: '2px solid #ff0000',
    borderTop: 'none',
    padding: '16px',
    backgroundColor: '#111111',
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  importTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: '16px',
    borderBottom: '1px solid #333333',
    paddingBottom: '8px',
  },
  importStep: {
    marginBottom: '12px',
  },
  stepLabel: {
    color: '#ffffff',
    marginBottom: '8px',
  },
  importDetails: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#000000',
    border: '1px solid #333333',
    borderRadius: '4px',
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '8px',
  },
  detailLabel: {
    color: '#888888',
    fontSize: '12px',
    marginBottom: '4px',
  },
  detailValue: {
    color: '#ffffff',
    fontSize: '13px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    padding: '4px 8px',
    backgroundColor: '#1a1a1a',
    borderRadius: '2px',
  },
  polygonscanLink: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #333333',
    textAlign: 'center',
  },
  link: {
    color: '#00a8ff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
  },
}

export default CertificateDisplay

