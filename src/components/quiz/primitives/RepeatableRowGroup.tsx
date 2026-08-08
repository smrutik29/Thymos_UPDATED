import { TextField } from "./TextField";

interface RowFieldConfig<T> {
  key: keyof T & string;
  placeholder: string;
}

interface RepeatableRowGroupProps<T> {
  rows: T[];
  fields: RowFieldConfig<T>[];
  onUpdateRow: (index: number, patch: Partial<T>) => void;
  onAddRow?: () => void;
  addLabel?: string;
  canAdd?: boolean;
}

export function RepeatableRowGroup<T>({
  rows,
  fields,
  onUpdateRow,
  onAddRow,
  addLabel,
  canAdd = true,
}: RepeatableRowGroupProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
          {fields.map((field) => (
            <TextField
              key={field.key}
              placeholder={field.placeholder}
              value={(row as Record<string, string>)[field.key] ?? ""}
              onChange={(value) =>
                onUpdateRow(index, { [field.key]: value } as Partial<T>)
              }
            />
          ))}
        </div>
      ))}
      {onAddRow && canAdd && (
        <button
          type="button"
          onClick={onAddRow}
          className="self-start text-[14px] font-semibold text-checkmark"
        >
          {addLabel ?? "+ Add another"}
        </button>
      )}
    </div>
  );
}
