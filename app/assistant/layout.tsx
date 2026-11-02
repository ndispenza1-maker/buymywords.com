import "../globals.css";

export const metadata = {
  title: "Mall Assistant",
};

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bare layout — no navbar, no wizard, no sidebar. Just the assistant.
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
