const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  dbQuery: (sql, params = []) => ipcRenderer.invoke('db-query', sql, params),
  print: () => ipcRenderer.invoke('print'),
  savePDF: (filename) => ipcRenderer.invoke('save-pdf', filename),
  dbTransaction: (statements) => ipcRenderer.invoke('db-transaction', statements),
  deleteSale: (saleId) => ipcRenderer.invoke('db-delete-sale', saleId),
  deletePurchase: (invoiceId) => ipcRenderer.invoke('db-delete-purchase', invoiceId),
  saveFile: (content, filename, filters) => ipcRenderer.invoke('save-file', content, filename, filters),
  openFile: (filters) => ipcRenderer.invoke('open-file', filters),
});
