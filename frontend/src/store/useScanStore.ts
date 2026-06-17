import { create } from 'zustand';

interface ScanState {
  activeScanId: string | null;
  logs: string[];
  progress: number;
  status: string;
  report: any | null;
  evidence: any | null;
  wsConnected: boolean;
  viewingReport: boolean;
  
  setViewReport: (val: boolean) => void;
  startScanSubscription: (scanId: string) => void;
  stopScanSubscription: () => void;
  setReportData: (report: any, evidence: any) => void;
  resetStore: () => void;
  appendLog: (log: string) => void;
}

let activeSocket: WebSocket | null = null;

export const useScanStore = create<ScanState>((set, get) => ({
  activeScanId: null,
  logs: [],
  progress: 0,
  status: 'idle',
  report: null,
  evidence: null,
  wsConnected: false,
  viewingReport: false,

  setViewReport: (val: boolean) => set({ viewingReport: val }),

  appendLog: (log: string) => {
    set((state) => ({ logs: [...state.logs, log] }));
  },

  startScanSubscription: (scanId: string) => {
    // Close existing socket
    if (activeSocket) {
      activeSocket.close();
    }

    set({
      activeScanId: scanId,
      progress: 0,
      status: 'pending',
      logs: [`[CLIENT] Connecting to intelligence websocket...`],
      report: null,
      evidence: null,
      wsConnected: false,
      viewingReport: false
    });

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const socketUrl = apiBase.replace(/^http/, 'ws');
    const socket = new WebSocket(socketUrl);
    activeSocket = socket;

    socket.onopen = () => {
      set({ wsConnected: true });
      get().appendLog(`[CLIENT] Connected. Requesting telemetry stream for scan: ${scanId}`);
      // Subscribe
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        scanId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'SUBSCRIBED') {
          get().appendLog(`[SYSTEM] ${data.message}`);
        } 
        
        else if (data.type === 'SCAN_UPDATE') {
          set({
            status: data.status,
            progress: data.progress
          });
          
          if (data.logs && data.logs.length > 0) {
            data.logs.forEach((logLine: string) => {
              get().appendLog(logLine);
            });
          }

          // If completed, fetch report via standard HTTP to sync local store
          if (data.status === 'completed') {
            get().appendLog(`[CLIENT] Fetching finalized report files...`);
            fetchReportAndEvidence(scanId, set);
            get().stopScanSubscription();
          } 
          
          else if (data.status === 'failed') {
            get().appendLog(`[SYSTEM] Execution failed. Pipeline terminated.`);
            get().stopScanSubscription();
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = () => {
      set({ wsConnected: false });
      console.log('WebSocket connection closed');
    };

    socket.onerror = () => {
      set({ wsConnected: false });
      get().appendLog(`[CLIENT ERROR] WebSocket connection failed. Updates will poll via HTTP.`);
    };
  },

  stopScanSubscription: () => {
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
    set({ wsConnected: false });
  },

  setReportData: (report: any, evidence: any) => {
    set({ report, evidence });
  },

  resetStore: () => {
    if (activeSocket) {
      activeSocket.close();
      activeSocket = null;
    }
    set({
      activeScanId: null,
      logs: [],
      progress: 0,
      status: 'idle',
      report: null,
      evidence: null,
      wsConnected: false,
      viewingReport: false
    });
  }
}));

// HTTP fetcher helper to get the generated report and store in Zustand
async function fetchReportAndEvidence(scanId: string, set: any) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    const reportRes = await fetch(`${apiBase}/api/scans/${scanId}/report`);
    const evidenceRes = await fetch(`${apiBase}/api/scans/${scanId}/evidence`);
    
    if (reportRes.ok && evidenceRes.ok) {
      const report = await reportRes.json();
      const evidenceData = await evidenceRes.json();
      const evidence = evidenceData.raw_evidence || evidenceData;
      set({ report, evidence, status: 'completed', progress: 100 });
    }
  } catch (err) {
    console.error('Error fetching finalized scan data:', err);
  }
}
