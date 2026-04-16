import { useState, useRef } from 'react';
import ShotCodeV2 from './ShotCodeV2';

const DynamicDataTypes = () => {
  const [dataType, setDataType] = useState('text');
  const [inputData, setInputData] = useState('');
  const [formattedData, setFormattedData] = useState('');

  const DATA_TYPES = {
    text: {
      name: 'Plain Text',
      icon: '📝',
      placeholder: 'Enter any text...',
      format: (data) => data
    },
    url: {
      name: 'URL/Link',
      icon: '🔗',
      placeholder: 'https://example.com',
      format: (data) => {
        // Add protocol if missing
        if (!data.startsWith('http://') && !data.startsWith('https://')) {
          return 'https://' + data;
        }
        return data;
      }
    },
    email: {
      name: 'Email',
      icon: '📧',
      placeholder: 'user@example.com',
      format: (data) => `mailto:${data}`
    },
    phone: {
      name: 'Phone',
      icon: '📱',
      placeholder: '+1234567890',
      format: (data) => `tel:${data.replace(/[^0-9+]/g, '')}`
    },
    sms: {
      name: 'SMS',
      icon: '💬',
      placeholder: '+1234567890',
      format: (data) => `sms:${data.replace(/[^0-9+]/g, '')}`
    },
    wifi: {
      name: 'WiFi',
      icon: '📶',
      placeholder: 'SSID|Password|WPA',
      format: (data) => {
        const [ssid, password, security = 'WPA'] = data.split('|');
        return `WIFI:T:${security};S:${ssid};P:${password};;`;
      }
    },
    vcard: {
      name: 'Contact Card',
      icon: '👤',
      placeholder: 'Name|Phone|Email',
      format: (data) => {
        const [name, phone, email] = data.split('|');
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
      }
    },
    location: {
      name: 'Location',
      icon: '📍',
      placeholder: 'latitude,longitude',
      format: (data) => {
        const [lat, lng] = data.split(',');
        return `geo:${lat.trim()},${lng.trim()}`;
      }
    },
    event: {
      name: 'Calendar Event',
      icon: '📅',
      placeholder: 'Title|Date|Location',
      format: (data) => {
        const [title, date, location] = data.split('|');
        return `BEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${date}\nLOCATION:${location}\nEND:VEVENT`;
      }
    }
  };

  const handleDataChange = (value) => {
    setInputData(value);
    const formatted = DATA_TYPES[dataType].format(value);
    setFormattedData(formatted);
  };

  const handleTypeChange = (type) => {
    setDataType(type);
    if (inputData) {
      const formatted = DATA_TYPES[type].format(inputData);
      setFormattedData(formatted);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Dynamic Data Types</h2>
      <p style={styles.subtitle}>Choose what type of data to encode</p>

      <div style={styles.typeGrid}>
        {Object.entries(DATA_TYPES).map(([key, type]) => (
          <button
            key={key}
            onClick={() => handleTypeChange(key)}
            style={{
              ...styles.typeButton,
              background: dataType === key ? '#3b82f6' : '#f3f4f6',
              color: dataType === key ? 'white' : '#333',
              border: dataType === key ? '2px solid #3b82f6' : '2px solid #ddd'
            }}
          >
            <div style={styles.typeIcon}>{type.icon}</div>
            <div style={styles.typeName}>{type.name}</div>
          </button>
        ))}
      </div>

      <div style={styles.inputSection}>
        <label style={styles.label}>
          Enter {DATA_TYPES[dataType].name}:
        </label>
        <textarea
          value={inputData}
          onChange={(e) => handleDataChange(e.target.value)}
          placeholder={DATA_TYPES[dataType].placeholder}
          style={styles.textarea}
        />
      </div>

      {formattedData && (
        <div style={styles.previewSection}>
          <label style={styles.label}>Formatted Data (what gets encoded):</label>
          <pre style={styles.preview}>{formattedData}</pre>
        </div>
      )}

      {formattedData && (
        <div style={styles.encoderSection}>
          <ShotCodeV2 initialText={formattedData} />
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  title: {
    textAlign: 'center',
    fontSize: '28px',
    marginBottom: '8px'
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '30px'
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '30px'
  },
  typeButton: {
    padding: '16px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center'
  },
  typeIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  typeName: {
    fontSize: '13px',
    fontWeight: '500'
  },
  inputSection: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    minHeight: '80px',
    fontFamily: 'monospace',
    resize: 'vertical'
  },
  previewSection: {
    marginBottom: '20px',
    padding: '15px',
    background: '#f9f9f9',
    borderRadius: '8px'
  },
  preview: {
    background: 'white',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '150px',
    margin: 0
  },
  encoderSection: {
    marginTop: '30px',
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '12px'
  }
};

export default DynamicDataTypes;
