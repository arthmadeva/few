"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Define Column Structure
interface ColumnDef {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "time" | "boolean" | "datetime";
  role: "System" | "Admin Cabang" | "Layanan Konsumen / CS" | "Staf Gudang" | "Staf Keuangan Manajemen" | "Cabang";
}

const COLUMNS: ColumnDef[] = [
  { key: "id", label: "ID", type: "number", role: "System" },
  { key: "created_at", label: "Waktu Dibuat", type: "datetime", role: "System" },
  { key: "cabang", label: "Cabang", type: "text", role: "Cabang" },
  // Admin Cabang (Registrasi)
  { key: "nama", label: "Nama Pelanggan", type: "text", role: "Admin Cabang" },
  { key: "email", label: "Email", type: "email", role: "Admin Cabang" },
  { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date", role: "Admin Cabang" },
  { key: "no_hp", label: "No HP", type: "text", role: "Admin Cabang" },
  { key: "nomor_kartu", label: "Nomor Kartu", type: "text", role: "Admin Cabang" },
  { key: "unit_bri", label: "Unit BRI", type: "text", role: "Admin Cabang" },
  { key: "promotor", label: "Promotor", type: "text", role: "Admin Cabang" },
  // CS
  { key: "nama_cs", label: "Nama CS", type: "text", role: "Layanan Konsumen / CS" },
  { key: "tanggal_telepon", label: "Tgl Telepon", type: "date", role: "Layanan Konsumen / CS" },
  { key: "jam_telepon", label: "Jam Telepon", type: "time", role: "Layanan Konsumen / CS" },
  { key: "plafon", label: "Plafon", type: "text", role: "Layanan Konsumen / CS" },
  { key: "resep", label: "Resep Lensa", type: "text", role: "Layanan Konsumen / CS" },
  { key: "beli", label: "Beli (Deal)", type: "boolean", role: "Layanan Konsumen / CS" },
  // Gudang
  { key: "nomor_acc_penjualan_silang", label: "No ACC Silang", type: "text", role: "Staf Gudang" },
  { key: "nomor_sp", label: "Nomor SP", type: "text", role: "Staf Gudang" },
  { key: "alamat_pengiriman", label: "Alamat Kirim", type: "text", role: "Staf Gudang" },
  { key: "verifikasi_no_hp", label: "Verif HP", type: "boolean", role: "Staf Gudang" },
  { key: "tanggal_kirim_frame", label: "Tgl Kirim Frame", type: "date", role: "Staf Gudang" },
  { key: "actual", label: "Actual", type: "text", role: "Staf Gudang" },
  { key: "tanggal_terima_frame", label: "Tgl Terima Frame", type: "date", role: "Staf Gudang" },
  { key: "sudah_terima_frame", label: "Sudah Terima Frame", type: "boolean", role: "Staf Gudang" },
  { key: "tanggal_kirim_lensa", label: "Tgl Kirim Lensa", type: "date", role: "Staf Gudang" },
  { key: "stock", label: "Stock", type: "boolean", role: "Staf Gudang" },
  { key: "gosok", label: "Gosok", type: "boolean", role: "Staf Gudang" },
  { key: "acc_pusat_actual", label: "ACC Pusat Act", type: "boolean", role: "Staf Gudang" },
  { key: "no_acc_pusat_actual", label: "No ACC Pusat Act", type: "text", role: "Staf Gudang" },
  { key: "no_faktur", label: "No Faktur", type: "text", role: "Staf Gudang" },
  { key: "tanggal_terima_lensa", label: "Tgl Terima Lensa", type: "date", role: "Staf Gudang" },
  { key: "sudah_produksi", label: "Sudah Produksi", type: "boolean", role: "Staf Gudang" },
  { key: "petugas_produksi", label: "Petugas Prod", type: "text", role: "Staf Gudang" },
  { key: "tanggal_selesai_produksi", label: "Tgl Selesai Prod", type: "date", role: "Staf Gudang" },
  // Keuangan
  { key: "proses_pengiriman", label: "Proses Kirim", type: "boolean", role: "Staf Keuangan Manajemen" },
  { key: "qc", label: "QC Pass", type: "boolean", role: "Staf Keuangan Manajemen" },
  { key: "resi_pengiriman", label: "Resi Kirim", type: "text", role: "Staf Keuangan Manajemen" },
  { key: "id_form", label: "ID Form", type: "text", role: "Staf Keuangan Manajemen" },
];

export default function SpreadsheetPage() {
  const router = useRouter();
  const supabase = createClient();

  // Authentication & Session States
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userCabang, setUserCabang] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  // Spreadsheet Data States
  const [rows, setRows] = useState<any[]>([]);
  const [originalRows, setOriginalRows] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("Semua");
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);

  // Cell interaction States
  const [focusedCell, setFocusedCell] = useState<{ rowIndex: number; colIndex: number; colKey: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [tempValue, setTempValue] = useState<any>("");

  // Performance/Feedback Indicators
  const [savingCells, setSavingCells] = useState<{ [key: string]: boolean }>({});
  const [errorCells, setErrorCells] = useState<{ [key: string]: boolean }>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Stats
  const [stats, setStats] = useState({ total: 0, pendingProd: 0, pendingDelivery: 0, completed: 0 });

  // Input ref for auto-focusing on edit
  const editInputRef = useRef<HTMLInputElement>(null);

  // Check network status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch Session & Profile on Mount
  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const user = session.user;
        setUserEmail(user.email || "");
        
        // Load role and branch from user_metadata
        const role = user.user_metadata?.role || "Guest";
        const cabang = user.user_metadata?.cabang || "";
        
        setUserRole(role);
        setUserCabang(cabang);
        setAuthLoading(false);

        // Load data once auth details are confirmed
        await fetchSpreadsheetData(role, cabang);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    }

    checkAuthAndLoad();
  }, []);

  // Recalculate statistics when data changes
  useEffect(() => {
    const total = rows.length;
    const pendingProd = rows.filter(r => r.beli === true && !r.sudah_produksi).length;
    const pendingDelivery = rows.filter(r => r.sudah_produksi === true && !r.proses_pengiriman).length;
    const completed = rows.filter(r => r.proses_pengiriman === true).length;
    
    setStats({ total, pendingProd, pendingDelivery, completed });

    // Populate branch filter options if management/gudang
    const branches = Array.from(new Set(rows.map(r => r.cabang).filter(Boolean))) as string[];
    setAvailableBranches(branches);
  }, [rows]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current.type === "text") {
        // Select all text on edit start
        editInputRef.current.select();
      }
    }
  }, [editingCell]);

  // Function to show feedback toasts
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch spreadsheet data
  const fetchSpreadsheetData = async (role: string, cabang: string) => {
    setDataLoading(true);
    try {
      let query = supabase.from("collect_data").select("*");

      // Filter query dynamically based on user role & RLS logic
      if (["Admin Cabang", "Layanan Konsumen / CS"].includes(role)) {
        query = query.eq("cabang", cabang);
      }

      const { data, error } = await query.order("id", { ascending: false });

      if (error) {
        throw error;
      }

      setRows(data || []);
      setOriginalRows(JSON.parse(JSON.stringify(data || [])));
    } catch (err: any) {
      showToast("Gagal memuat data: " + (err.message || "Masalah koneksi"), "error");
    } finally {
      setDataLoading(false);
    }
  };

  // Check if a cell is editable by the current logged-in role
  const canEditCell = (columnName: string, role: string): boolean => {
    if (role === "Staf Keuangan Manajemen") {
      return ["proses_pengiriman", "qc", "resi_pengiriman", "id_form", "cabang"].includes(columnName);
    }
    if (role === "Staf Gudang") {
      const gudangColumns = [
        "nomor_acc_penjualan_silang", "nomor_sp", "alamat_pengiriman", "verifikasi_no_hp",
        "tanggal_kirim_frame", "actual", "tanggal_terima_frame", "sudah_terima_frame",
        "tanggal_kirim_lensa", "stock", "gosok", "acc_pusat_actual", "no_acc_pusat_actual",
        "no_faktur", "tanggal_terima_lensa", "sudah_produksi", "petugas_produksi",
        "tanggal_selesai_produksi", "cabang"
      ];
      return gudangColumns.includes(columnName);
    }
    if (role === "Layanan Konsumen / CS") {
      return ["nama_cs", "tanggal_telepon", "jam_telepon", "plafon", "resep", "beli"].includes(columnName);
    }
    if (role === "Admin Cabang") {
      return ["nama", "email", "tanggal_lahir", "no_hp", "nomor_kartu", "unit_bri", "promotor", "cabang"].includes(columnName);
    }
    return false;
  };

  // Frontend Data Validation
  const validateCell = (columnKey: string, type: string, value: any): { isValid: boolean; errorMsg?: string } => {
    if (value === null || value === undefined || value === "") {
      return { isValid: true };
    }

    const strVal = String(value).trim();

    if (type === "date") {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(strVal)) {
        return { isValid: false, errorMsg: "Format Tanggal harus YYYY-MM-DD" };
      }
      const d = new Date(strVal);
      if (isNaN(d.getTime())) {
        return { isValid: false, errorMsg: "Nilai Tanggal tidak valid" };
      }
    }

    if (type === "time") {
      // HH:MM or HH:MM:SS
      const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!regex.test(strVal)) {
        return { isValid: false, errorMsg: "Format Waktu harus HH:MM atau HH:MM:SS" };
      }
    }

    if (type === "email") {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(strVal)) {
        return { isValid: false, errorMsg: "Format Email tidak valid" };
      }
    }

    return { isValid: true };
  };

  // Commit and sync edit to Supabase
  const saveCell = async (rowId: number, colKey: string, newValue: any, oldValue: any, rowIndex: number) => {
    const cellId = `${rowId}-${colKey}`;
    
    // Check if network is offline before trying to sync
    if (!navigator.onLine) {
      showToast("Koneksi terputus! Sinkronisasi gagal dan data dibatalkan.", "error");
      
      // Rollback local state
      setRows(prev => prev.map((r, idx) => idx === rowIndex ? { ...r, [colKey]: oldValue } : r));
      
      // Set cell in error state briefly
      setErrorCells(prev => ({ ...prev, [cellId]: true }));
      setTimeout(() => {
        setErrorCells(prev => {
          const copy = { ...prev };
          delete copy[cellId];
          return copy;
        });
      }, 3000);
      return;
    }

    // Set cell saving status
    setSavingCells(prev => ({ ...prev, [cellId]: true }));

    try {
      const { error } = await supabase
        .from("collect_data")
        .update({ [colKey]: newValue })
        .eq("id", rowId);

      if (error) {
        throw error;
      }

      // Success: Remove saving indicator
      setSavingCells(prev => {
        const copy = { ...prev };
        delete copy[cellId];
        return copy;
      });

      // Update the original rows store for accurate rollbacks
      setOriginalRows(prev => prev.map(r => r.id === rowId ? { ...r, [colKey]: newValue } : r));
      
    } catch (err: any) {
      console.error("Save failed:", err);
      // Rollback UI to oldValue
      setRows(prev => prev.map((r, idx) => idx === rowIndex ? { ...r, [colKey]: oldValue } : r));

      // Trigger cell visual error border
      setErrorCells(prev => ({ ...prev, [cellId]: true }));
      setTimeout(() => {
        setErrorCells(prev => {
          const copy = { ...prev };
          delete copy[cellId];
          return copy;
        });
      }, 3000);

      showToast(`Gagal menyinkronkan data: ${err.message || "Masalah Database / Jaringan"}. Data dibatalkan.`, "error");

      setSavingCells(prev => {
        const copy = { ...prev };
        delete copy[cellId];
        return copy;
      });
    }
  };

  // Keyboard navigation & cell focus transitions
  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number, colKey: string) => {
    if (editingCell) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit(rowIndex, colKey);
        // Move focus down after editing finishes
        moveFocus(rowIndex + 1, colIndex);
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitEdit(rowIndex, colKey);
        if (e.shiftKey) {
          moveFocus(rowIndex, colIndex - 1);
        } else {
          moveFocus(rowIndex, colIndex + 1);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditingCell(null);
      }
      return;
    }

    let targetRow = rowIndex;
    let targetCol = colIndex;
    let handled = false;

    switch (e.key) {
      case "ArrowUp":
        targetRow = Math.max(0, rowIndex - 1);
        handled = true;
        break;
      case "ArrowDown":
        targetRow = Math.min(rows.length - 1, rowIndex + 1);
        handled = true;
        break;
      case "ArrowLeft":
        targetCol = Math.max(0, colIndex - 1);
        handled = true;
        break;
      case "ArrowRight":
        targetCol = Math.min(COLUMNS.length - 1, colIndex + 1);
        handled = true;
        break;
      case "Tab":
        handled = true;
        if (e.shiftKey) {
          if (colIndex > 0) {
            targetCol = colIndex - 1;
          } else if (rowIndex > 0) {
            targetRow = rowIndex - 1;
            targetCol = COLUMNS.length - 1;
          }
        } else {
          if (colIndex < COLUMNS.length - 1) {
            targetCol = colIndex + 1;
          } else if (rowIndex < rows.length - 1) {
            targetRow = rowIndex + 1;
            targetCol = 0;
          }
        }
        break;
      case "Enter":
        handled = true;
        if (canEditCell(colKey, userRole)) {
          startEditing(rowIndex, colIndex, colKey);
        }
        break;
      default:
        break;
    }

    if (handled) {
      e.preventDefault();
      setFocusedCell({ rowIndex: targetRow, colIndex: targetCol, colKey: COLUMNS[targetCol].key });
    }
  };

  const moveFocus = (rIndex: number, cIndex: number) => {
    if (rIndex >= 0 && rIndex < rows.length && cIndex >= 0 && cIndex < COLUMNS.length) {
      setFocusedCell({ rowIndex: rIndex, colIndex: cIndex, colKey: COLUMNS[cIndex].key });
    }
  };

  const startEditing = (rowIndex: number, colIndex: number, colKey: string) => {
    const row = rows[rowIndex];
    setEditingCell({ rowIndex, colKey });
    setTempValue(row[colKey] ?? "");
  };

  const commitEdit = (rowIndex: number, colKey: string) => {
    const row = rows[rowIndex];
    const rowId = row.id;
    const oldValue = originalRows.find(r => r.id === rowId)?.[colKey];

    // Read column definition for type check
    const colDef = COLUMNS.find(c => c.key === colKey)!;
    
    // Check validation
    const { isValid, errorMsg } = validateCell(colKey, colDef.type, tempValue);

    if (!isValid) {
      // Revert cell in current rows state
      setRows(prev => prev.map((r, idx) => idx === rowIndex ? { ...r, [colKey]: oldValue ?? null } : r));
      setErrorCells(prev => ({ ...prev, [`${rowId}-${colKey}`]: true }));
      setTimeout(() => {
        setErrorCells(prev => {
          const copy = { ...prev };
          delete copy[`${rowId}-${colKey}`];
          return copy;
        });
      }, 3000);

      showToast(`Invalid Input Type Format: ${errorMsg}`, "error");
      setEditingCell(null);
      return;
    }

    // Prepare final value (convert empty strings to null)
    let finalValue: any = tempValue;
    if (tempValue === "") {
      finalValue = null;
    } else if (colDef.type === "number") {
      finalValue = Number(tempValue);
    }

    // Only update if value actually changed
    if (finalValue !== oldValue) {
      setRows(prev => prev.map((r, idx) => idx === rowIndex ? { ...r, [colKey]: finalValue } : r));
      saveCell(rowId, colKey, finalValue, oldValue, rowIndex);
    }

    setEditingCell(null);
  };

  // Handles fast boolean toggling
  const handleCheckboxChange = (rowIndex: number, colKey: string, currentValue: boolean) => {
    const row = rows[rowIndex];
    const rowId = row.id;
    const oldValue = currentValue;
    const newValue = !currentValue;

    // Optimistically update
    setRows(prev => prev.map((r, idx) => idx === rowIndex ? { ...r, [colKey]: newValue } : r));
    saveCell(rowId, colKey, newValue, oldValue, rowIndex);
  };

  // Add Row Functionality
  const handleAddRow = async () => {
    if (!isOnline) {
      showToast("Tidak dapat menambahkan baris baru saat offline!", "error");
      return;
    }

    setDataLoading(true);
    try {
      const newRowData: any = {};
      
      // Auto-fill branch value if user is restricted
      if (["Admin Cabang", "Layanan Konsumen / CS"].includes(userRole)) {
        newRowData.cabang = userCabang;
      } else {
        newRowData.cabang = "Bandung"; // default fallback for Gudang/Finance
      }

      const { data, error } = await supabase
        .from("collect_data")
        .insert([newRowData])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const insertedRow = data[0];
        setRows(prev => [insertedRow, ...prev]);
        setOriginalRows(prev => [insertedRow, ...prev]);
        showToast("Baris baru berhasil ditambahkan!", "success");
        
        // Focus on the first editable column of this new row
        setFocusedCell({ rowIndex: 0, colIndex: 3, colKey: COLUMNS[3].key });
      }
    } catch (err: any) {
      showToast("Gagal menambahkan baris: " + (err.message || "Masalah DB / Jaringan"), "error");
    } finally {
      setDataLoading(false);
    }
  };

  // Logout Functionality
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Helper for column role badge styling
  const getRoleHeaderStyle = (role: string) => {
    switch (role) {
      case "Admin Cabang":
        return "bg-indigo-600 text-white border-indigo-700";
      case "Layanan Konsumen / CS":
        return "bg-fuchsia-600 text-white border-fuchsia-700";
      case "Staf Gudang":
        return "bg-amber-600 text-white border-amber-700";
      case "Staf Keuangan Manajemen":
        return "bg-emerald-600 text-white border-emerald-700";
      case "System":
        return "bg-zinc-800 text-zinc-300 border-zinc-900";
      case "Cabang":
        return "bg-sky-600 text-white border-sky-700";
      default:
        return "bg-zinc-700 text-white border-zinc-800";
    }
  };

  // Render cell contents
  const renderCellContent = (row: any, col: ColumnDef, rowIndex: number, colIndex: number) => {
    const value = row[col.key];
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === col.key;
    const isFocused = focusedCell?.rowIndex === rowIndex && focusedCell?.colKey === col.key;
    const isSaving = savingCells[`${row.id}-${col.key}`];
    const hasError = errorCells[`${row.id}-${col.key}`];
    const isEditable = canEditCell(col.key, userRole);

    let cellClass = "px-3 py-2 text-sm relative select-none truncate outline-none h-full flex items-center min-h-[38px] border-r border-zinc-800 group-hover:bg-zinc-900/30 ";

    // Lock style
    if (!isEditable && col.role !== "System") {
      cellClass += "bg-zinc-900/50 text-zinc-500 cursor-not-allowed ";
    } else if (col.role === "System") {
      cellClass += "bg-zinc-950/70 text-zinc-500 font-mono text-xs cursor-not-allowed ";
    } else {
      cellClass += "text-zinc-200 cursor-pointer ";
    }

    // Focus style
    if (isFocused) {
      cellClass += "ring-2 ring-indigo-500 ring-inset bg-indigo-500/10 z-20 ";
    }

    // Error style
    if (hasError) {
      cellClass += "ring-2 ring-red-500 ring-inset bg-red-500/10 z-20 ";
    }

    // Render checkbox directly
    if (col.type === "boolean") {
      return (
        <div 
          className={`${cellClass} justify-center`}
          onClick={() => {
            if (isEditable) {
              handleCheckboxChange(rowIndex, col.key, !!value);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex, col.key)}
          tabIndex={0}
        >
          <input
            type="checkbox"
            checked={!!value}
            disabled={!isEditable}
            onChange={() => {}} // Controlled manually via onClick of parent for better click target
            className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 cursor-pointer disabled:cursor-not-allowed"
          />
          {isSaving && (
            <div className="absolute right-1 top-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            </div>
          )}
        </div>
      );
    }

    // Editing Render
    if (isEditing) {
      return (
        <div className="absolute inset-0 z-30 p-0.5 bg-zinc-950">
          <input
            ref={editInputRef}
            type={col.type === "date" ? "date" : col.type === "time" ? "time" : "text"}
            className="w-full h-full bg-zinc-900 text-white border border-indigo-500 px-2.5 py-1 text-sm rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={() => commitEdit(rowIndex, col.key)}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex, col.key)}
          />
        </div>
      );
    }

    // Normal Text Render
    let displayValue = value;
    if (col.type === "datetime" && value) {
      displayValue = new Date(value).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
    }

    return (
      <div
        className={cellClass}
        onClick={() => {
          setFocusedCell({ rowIndex, colIndex, colKey: col.key });
        }}
        onDoubleClick={() => {
          if (isEditable) {
            startEditing(rowIndex, colIndex, col.key);
          }
        }}
        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex, col.key)}
        tabIndex={0}
      >
        <span>{displayValue !== null && displayValue !== undefined ? String(displayValue) : ""}</span>
        
        {isSaving && (
          <div className="absolute right-1.5 top-1.5 flex items-center justify-center">
            <svg className="animate-spin h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Perform Local Search/Filtering
  const filteredRows = rows.filter((row) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = row.nama?.toLowerCase().includes(term);
      const matchEmail = row.email?.toLowerCase().includes(term);
      const matchNoHp = row.no_hp?.toLowerCase().includes(term);
      const matchPromotor = row.promotor?.toLowerCase().includes(term);
      const matchId = String(row.id).includes(term);
      if (!matchName && !matchEmail && !matchNoHp && !matchPromotor && !matchId) {
        return false;
      }
    }

    if (["Staf Gudang", "Staf Keuangan Manajemen"].includes(userRole) && selectedBranchFilter !== "Semua") {
      if (row.cabang !== selectedBranchFilter) {
        return false;
      }
    }

    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-zinc-400 text-sm tracking-wide">Memverifikasi Sesi Autentikasi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div className={`flex items-center space-x-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl ${
            toast.type === "success" 
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
              : toast.type === "error" 
              ? "bg-red-500/15 border-red-500/30 text-red-400" 
              : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
          }`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : toast.type === "error" ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Premium Header Panel */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
            AK
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Akur Optic 55</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-indigo-400 font-semibold uppercase tracking-wider">
                PROYEK AKUR
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Integrasi Spreadsheet Data Registrasi & Gudang</p>
          </div>
        </div>

        {/* Stats summary banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-950/40 p-2 border border-zinc-800/80 rounded-xl max-w-2xl w-full md:w-auto">
          <div className="px-3 py-1.5 text-center border-r border-zinc-800/80 last:border-none">
            <span className="block text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Total Baris</span>
            <span className="text-sm font-bold text-white">{stats.total}</span>
          </div>
          <div className="px-3 py-1.5 text-center border-r border-zinc-800/80 last:border-none">
            <span className="block text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Beli CS (Pending Prod)</span>
            <span className="text-sm font-bold text-amber-400">{stats.pendingProd}</span>
          </div>
          <div className="px-3 py-1.5 text-center border-r border-zinc-800/80 last:border-none">
            <span className="block text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Siap Kirim (Pending QC)</span>
            <span className="text-sm font-bold text-sky-400">{stats.pendingDelivery}</span>
          </div>
          <div className="px-3 py-1.5 text-center border-r border-zinc-800/80 last:border-none">
            <span className="block text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Selesai Dikirim</span>
            <span className="text-sm font-bold text-emerald-400">{stats.completed}</span>
          </div>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center justify-between md:justify-end space-x-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-white tracking-wide">{userEmail}</div>
            <div className="text-[10px] text-zinc-400 flex items-center space-x-1.5 justify-end mt-0.5">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`}></span>
              <span>{isOnline ? "Online" : "Offline"}</span>
              <span>•</span>
              <span className="text-indigo-400 font-medium">{userRole}</span>
              {["Admin Cabang", "Layanan Konsumen / CS"].includes(userRole) && (
                <>
                  <span>•</span>
                  <span className="text-sky-400 font-medium">Cabang: {userCabang}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center space-x-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Spreadsheet Toolbar Controls */}
      <section className="bg-zinc-900/40 border-b border-zinc-800/80 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari ID, Nama, No HP, Kartu..."
              className="w-full sm:w-64 bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-zinc-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Branch Filter dropdown for Gudang/Manajemen */}
          {["Staf Gudang", "Staf Keuangan Manajemen"].includes(userRole) && (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold">Cabang:</span>
              <select
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
              >
                <option value="Semua">Semua Wilayah</option>
                {availableBranches.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-3 justify-end">
          {dataLoading && (
            <span className="text-xs text-zinc-500 flex items-center space-x-1.5 animate-pulse mr-2">
              <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Sinkronisasi...</span>
            </span>
          )}

          <button
            onClick={() => fetchSpreadsheetData(userRole, userCabang)}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white cursor-pointer transition-colors"
            title="Refresh Sheet"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
            </svg>
          </button>

          <button
            onClick={handleAddRow}
            disabled={dataLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Baris Baru</span>
          </button>
        </div>
      </section>

      {/* Main Excel-like spreadsheet workspace grid */}
      <main className="flex-1 overflow-auto bg-zinc-950 relative">
        {filteredRows.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <svg className="w-12 h-12 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">Tidak ada data yang ditemukan</p>
            <p className="text-xs text-zinc-600 mt-1">Coba sesuaikan filter atau cari data dengan kata kunci lain</p>
          </div>
        ) : (
          <table className="border-collapse table-fixed w-max min-w-full">
            {/* Table Headers */}
            <thead className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800">
              {/* Colored Role Group Headings */}
              <tr>
                <th className="w-12 bg-zinc-900 border-r border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 text-center select-none"></th>
                {COLUMNS.map((col, idx) => {
                  let style = "text-center text-[9px] uppercase font-bold py-1 border-r border-zinc-800 select-none ";
                  
                  // Frozen column style
                  let isFrozen = ["id", "nama", "cabang"].includes(col.key);
                  let frozenClass = "";
                  let leftOffset = 0;
                  if (col.key === "id") leftOffset = 48; // w-12 is 48px
                  if (col.key === "nama") leftOffset = 148; // id (100px) + index
                  if (col.key === "cabang") leftOffset = 298; // id(100px)+nama(150px)+index
                  
                  if (isFrozen) {
                    frozenClass = "sticky left-0 bg-zinc-900 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.4)] ";
                  }

                  return (
                    <th
                      key={`grp-${col.key}`}
                      className={`${style} ${frozenClass} ${getRoleHeaderStyle(col.role)}`}
                      style={{
                        width: col.key === "id" ? "100px" : col.key === "nama" ? "150px" : col.key === "cabang" ? "110px" : "150px",
                        left: isFrozen ? `${leftOffset}px` : undefined,
                      }}
                    >
                      {col.role}
                    </th>
                  );
                })}
              </tr>
              {/* Detailed Column Key Labels */}
              <tr className="bg-zinc-900/90 text-zinc-400">
                <th className="w-12 h-10 border-r border-b border-zinc-800 text-[11px] font-semibold text-center select-none sticky left-0 bg-zinc-900 z-50">#</th>
                {COLUMNS.map((col) => {
                  let headerClass = "px-3 py-2 border-r border-b border-zinc-800 text-left text-xs font-semibold tracking-wider select-none h-10 ";
                  
                  // Frozen column logic
                  let isFrozen = ["id", "nama", "cabang"].includes(col.key);
                  let frozenClass = "";
                  let leftOffset = 0;
                  if (col.key === "id") leftOffset = 48;
                  if (col.key === "nama") leftOffset = 148;
                  if (col.key === "cabang") leftOffset = 298;

                  if (isFrozen) {
                    frozenClass = "sticky left-0 bg-zinc-900 z-50 shadow-[2px_0_5px_rgba(0,0,0,0.4)] ";
                  }

                  return (
                    <th
                      key={col.key}
                      className={`${headerClass} ${frozenClass}`}
                      style={{
                        width: col.key === "id" ? "100px" : col.key === "nama" ? "150px" : col.key === "cabang" ? "110px" : "150px",
                        left: isFrozen ? `${leftOffset}px` : undefined,
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-zinc-200 text-xs truncate leading-normal">{col.label}</span>
                        <span className="text-[10px] text-zinc-500 font-mono tracking-tight font-normal leading-none mt-0.5">{col.key}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900/20 group h-[38px] transition-colors"
                >
                  {/* Left row index cell */}
                  <td className="w-12 bg-zinc-950 border-r border-zinc-800 text-center text-xs font-mono text-zinc-500 font-semibold select-none sticky left-0 z-30 group-hover:bg-zinc-900/60 shadow-[2px_0_5px_rgba(0,0,0,0.4)]">
                    {rowIndex + 1}
                  </td>
                  
                  {COLUMNS.map((col, colIndex) => {
                    // Frozen column check
                    let isFrozen = ["id", "nama", "cabang"].includes(col.key);
                    let frozenClass = "";
                    let leftOffset = 0;
                    if (col.key === "id") leftOffset = 48;
                    if (col.key === "nama") leftOffset = 148;
                    if (col.key === "cabang") leftOffset = 298;

                    if (isFrozen) {
                      frozenClass = "sticky left-0 bg-zinc-950 z-30 group-hover:bg-zinc-900/40 shadow-[2px_0_5px_rgba(0,0,0,0.4)] ";
                    }

                    return (
                      <td
                        key={col.key}
                        className={`${frozenClass} p-0`}
                        style={{
                          width: col.key === "id" ? "100px" : col.key === "nama" ? "150px" : col.key === "cabang" ? "110px" : "150px",
                          left: isFrozen ? `${leftOffset}px` : undefined,
                        }}
                      >
                        {renderCellContent(row, col, rowIndex, colIndex)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {/* Spreadsheet Keyboard Navigation Helpers */}
      <footer className="bg-zinc-900 border-t border-zinc-800 px-6 py-2.5 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Arrow Keys</kbd>
            <span>Navigasi Sel</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Tab</kbd>
            <span>Sel Kanan</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Enter</kbd>
            <span>Edit / Simpan</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Double Click</kbd>
            <span>Mulai Edit</span>
          </span>
          <span className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Esc</kbd>
            <span>Batal</span>
          </span>
        </div>
        <div>
          <span>Integrasi Spreadsheet AKUR • Hak Cipta © 2026 Akur Optic 55</span>
        </div>
      </footer>
    </div>
  );
}
