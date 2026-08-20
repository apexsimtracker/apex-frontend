import {
  forwardRef,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { appManualSelectClassName } from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";
import {
  catalogSearchKey,
  filterCatalogOptions,
  type CatalogPickerOption,
} from "./catalogPickerSearch";

export type { CatalogPickerOption } from "./catalogPickerSearch";

type CatalogPickerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onChange" | "children"
> & {
  value: string;
  onValueChange: (value: string) => void;
  options: CatalogPickerOption[];
  label: string;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowClear?: boolean;
};

const CatalogPicker = forwardRef<HTMLButtonElement, CatalogPickerProps>(
  function CatalogPicker(
    {
      value,
      onValueChange,
      options,
      label,
      placeholder,
      searchPlaceholder = `Search ${label.toLowerCase()}…`,
      emptyMessage = `No ${label.toLowerCase()} found.`,
      allowClear = false,
      className,
      disabled,
      id,
      ...triggerProps
    },
    forwardedRef,
  ) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const listId = useId();
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const selected = options.find((option) => option.id === value);
    const storedValue = value.trim() && !selected ? value.trim() : null;

    const filteredOptions = useMemo(() => {
      return filterCatalogOptions(options, query);
    }, [options, query]);

    function handleOpenChange(nextOpen: boolean) {
      setOpen(nextOpen);
      if (nextOpen) {
        setQuery("");
        const selectedIndex = options.findIndex(
          (option) => option.id === value,
        );
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }

    function select(nextValue: string) {
      onValueChange(nextValue);
      handleOpenChange(false);
    }

    function focusOption(index: number) {
      if (filteredOptions.length === 0) return;
      const nextIndex =
        (index + filteredOptions.length) % filteredOptions.length;
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    }

    function handleOptionKeyDown(
      event: KeyboardEvent<HTMLButtonElement>,
      index: number,
    ) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusOption(index + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        focusOption(index - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        focusOption(0);
      } else if (event.key === "End") {
        event.preventDefault();
        focusOption(filteredOptions.length - 1);
      }
    }

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <button
          {...triggerProps}
          ref={forwardedRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            appManualSelectClassName,
            "flex cursor-pointer items-center justify-between gap-3 text-left",
            !selected && !storedValue && "text-apex-on-surface-variant/60",
            className,
          )}
          onClick={() => handleOpenChange(true)}
        >
          <span className="min-w-0 truncate">
            {selected?.name ?? storedValue ?? placeholder}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-apex-on-surface-variant"
            aria-hidden
          />
        </button>

        <DialogContent
          size="md"
          mobileVariant="sheet"
          className="apex-theme max-h-[85dvh] overflow-hidden p-0"
        >
          <DialogHeader className="border-b border-apex-outline-variant/20 px-5 pb-4 pt-5">
            <DialogTitle>Select {label.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Search {options.length.toLocaleString()} available options.
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 pt-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apex-on-surface-variant"
                aria-hidden
              />
              <Input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" && filteredOptions.length > 0) {
                    event.preventDefault();
                    focusOption(0);
                  }
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                role="combobox"
                aria-controls={listId}
                aria-expanded="true"
                aria-autocomplete="list"
                className="border-apex-outline-variant/30 bg-apex-surface-container pl-9 text-apex-on-surface"
              />
            </div>
          </div>

          <div
            id={listId}
            role="listbox"
            aria-label={`${label} options`}
            className="mt-3 max-h-[55dvh] overflow-y-auto px-2 pb-4"
          >
            {allowClear && value ? (
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => select("")}
                className="flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm text-apex-on-surface-variant hover:bg-apex-surface-container-high"
              >
                Clear selection
              </button>
            ) : null}

            {storedValue && !query ? (
              <button
                type="button"
                role="option"
                aria-selected="true"
                onClick={() => select(storedValue)}
                className="flex w-full items-center justify-between gap-3 rounded-md bg-apex-primary/10 px-3 py-2.5 text-left text-sm text-apex-on-surface"
              >
                <span className="min-w-0">
                  <span className="block truncate">{storedValue}</span>
                  <span className="block text-xs text-apex-on-surface-variant">
                    Stored token — not in catalog
                  </span>
                </span>
                <Check
                  className="size-4 shrink-0 text-apex-primary"
                  aria-hidden
                />
              </button>
            ) : null}

            {filteredOptions.map((option, index) => {
              const isSelected = option.id === value;
              return (
                <button
                  key={option.id}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={index === activeIndex ? 0 : -1}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleOptionKeyDown(event, index)}
                  onClick={() => select(option.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm text-apex-on-surface transition-colors",
                    "hover:bg-apex-surface-container-high focus:bg-apex-surface-container-high focus:outline-none",
                    isSelected && "bg-apex-primary/10",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.name}</span>
                    {catalogSearchKey(option.id) !==
                    catalogSearchKey(option.name) ? (
                      <span className="block truncate text-xs text-apex-on-surface-variant">
                        {option.id}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check
                      className="size-4 shrink-0 text-apex-primary"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}

            {filteredOptions.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-apex-on-surface-variant">
                {emptyMessage}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

export default CatalogPicker;
