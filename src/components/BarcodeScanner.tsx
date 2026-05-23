// src/components/BarcodeScanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Colors, Radii, Spacing, Typography } from '../lib/design';

interface BarcodeScannerProps {
  visible: boolean;
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ visible, onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    let codeReader: any = null;

    const startScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        codeReader = new BrowserMultiFormatReader();
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const selectedDeviceId = videoInputDevices[0]?.deviceId;

        if (!selectedDeviceId) {
          setError('No camera found');
          return;
        }

        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result: any) => {
            if (result) {
              onScan(result.getText());
            }
          }
        );
      } catch (err) {
        setError('Camera access denied');
      }
    };

    startScanner();

    return () => {
      if (codeReader) {
        BrowserMultiFormatReader.releaseAllStreams();
      }
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Barcode</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.videoContainer}>
            {/* @ts-ignore */}
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.hint}>Point camera at barcode</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.base, paddingTop: 50, backgroundColor: '#000',
  },
  title: { fontSize: Typography.lg, fontWeight: '700', color: '#fff' },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 20, color: '#fff' },
  videoContainer: { flex: 1, position: 'relative' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  scanFrame: {
    width: 250, height: 250, borderWidth: 2, borderColor: Colors.primary,
    borderRadius: Radii.md, backgroundColor: 'transparent',
  },
  hint: { color: '#fff', marginTop: 16, fontSize: Typography.sm },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontSize: Typography.base },
});