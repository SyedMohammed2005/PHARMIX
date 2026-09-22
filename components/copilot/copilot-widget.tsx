"use client";

import { useState } from "react";
import CopilotButton from "@/components/copilot/copilot-button";
import CopilotPanel from "@/components/copilot/copilot-panel";

export default function CopilotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CopilotPanel
        open={open}
        onClose={() => setOpen(false)}
      />

      <CopilotButton
        open={open}
        onClick={() =>
          setOpen((current) => !current)
        }
      />
    </>
  );
}