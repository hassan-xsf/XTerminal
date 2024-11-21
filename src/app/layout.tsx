import type { Metadata } from "next";
import "./globals.css";
import { SquareTerminal, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "XTerminal",
  description: "A simple mac terminal emulator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-mono">
        <div className="fixed inset-0 bg-gray-900 text-gray-100 p-4 md:p-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
              <Terminal className="w-8 h-8 text-red-500" />
              XTerminal
            </h1>
            <p className="text-lg text-gray-400">
              A simple mac terminal emulator
            </p>
          </header>
          <div className="flex justify-center items-center">
            <div className="w-full max-w-5xl bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-700">
              <div className="bg-gradient-to-b from-gray-700 to-gray-800 border-b border-gray-900">
                <div className="flex items-center h-8 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff4b4b] transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#f9b31c] transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#24b539] transition-colors cursor-pointer" />
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
                    <Terminal className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  </div>
                </div>
              </div>
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
