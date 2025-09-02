import win32print
import win32api
import time
from pathlib import Path

class SinglePrinter:
    """Manages finding and printing to a single XP-80C printer."""
    def __init__(self):
        self.printer_name = self._find_xprinter()
        if self.printer_name:
            print(f"✅ Printer found: {self.printer_name}")
        else:
            print(f"❌ Error: Could not find an 'XP-80C' printer. Check connection and driver name.")

    def _find_xprinter(self) -> str | None:
        """Finds the first printer with 'XP-80C' in its name."""
        printers = [p[2] for p in win32print.EnumPrinters(2)]
        for p in printers:
            if 'XP-80C' in p:
                return p
        return None

    def print_file(self, file_path: str | Path) -> bool:
        """Prints a single file to the found printer."""
        if not self.printer_name:
            print("❌ Error: Printer is not configured. Cannot print.")
            return False
        
        abs_path = str(Path(file_path).resolve())
        print(f"\n--- Printing file: {abs_path} ---")

        # Print to the single printer
        return self._print_to_printer(abs_path, self.printer_name, "Receipt Printer")

    def _print_to_printer(self, file_path: str, printer_name: str, printer_label: str) -> bool:
        """Temporarily sets the default printer and sends a print job."""
        try:
            current_default = win32print.GetDefaultPrinter()
            win32print.SetDefaultPrinter(printer_name)
            win32api.ShellExecute(0, "print", file_path, None, ".", 0)
            time.sleep(3)  # Give time for the job to be spooled
            print(f"✅ Sent to {printer_label} ({printer_name})")
            return True
        except Exception as e:
            print(f"❌ CRITICAL ERROR printing to {printer_label}: {e}")
            return False
        finally:
            # Always try to restore the original default printer
            if 'current_default' in locals():
                win32print.SetDefaultPrinter(current_default)
