"use client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: string | number;
  [key: string]: any;
}

interface SelectBoxProps {
  label: string;
  name: string;
  val: string;
  fn: (e: any) => void;
  opts: Option[];
  k: string;
}

// 1. Komponen SelectBox (Dropdown Dinamis)
export function SelectBox({ label, name, val, fn, opts, k }: SelectBoxProps) {
  const handleValueChange = (newValue: string) => {
    fn({
      target: {
        name: name,
        value: newValue,
      },
    });
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor={name} className="text-sm font-bold text-gray-800">
        {label}
      </Label>

      <Select value={val} onValueChange={handleValueChange} name={name}>
        <SelectTrigger
          id={name}
          className="w-full text-sm h-[38px] border-gray-300 focus:ring-emerald-500 bg-white"
        >
          <SelectValue placeholder={`Semua ${label}`} />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value={undefined!} className="text-gray-500">
            Semua {label}
          </SelectItem>

          {opts.map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {/* Tampilkan Nama Periode jika ada (untuk Kelas) */}
              {o.periodeNama ? `${o[k]} (${o.periodeNama})` : o[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// 2. Komponen DateInput (Input Tanggal) <-- INI YANG HILANG SEBELUMNYA
export function DateInput({ label, name, val, fn }: any) {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label className="text-sm font-bold text-gray-800">{label}</Label>
      <input
        type="date"
        name={name}
        value={val}
        onChange={fn}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-emerald-500 bg-white text-gray-600 font-medium h-[38px]"
      />
    </div>
  );
}

// 3. Komponen StatusSelect (Dropdown Status CheckIn/Out)
export function StatusSelect({ val, fn }: { val: string; fn: (v: string) => void }) {
  return (
    <div className="flex flex-col space-y-1.5">
      <Label className="text-sm font-bold text-gray-800">Status</Label>
      <Select value={val} onValueChange={fn}>
        <SelectTrigger className="w-full text-sm h-[38px] border-gray-300 bg-white focus:ring-emerald-500">
          <SelectValue placeholder="Semua Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={undefined!}>Semua Status</SelectItem>
          <SelectItem value="CHECKIN">Check In</SelectItem>
          <SelectItem value="CHECKOUT">Check Out</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}