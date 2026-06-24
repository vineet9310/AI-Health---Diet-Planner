import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Disclaimer = ({ className = '' }) => {
  return (
    <div className={`p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-sm flex gap-3 items-start ${className}`}>
      <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-amber-400 mb-0.5 font-heading">Disclaimer & Safety Warning</h4>
        <p className="opacity-90">
          This is not medical advice. Consult a registered doctor or dietitian before making health decisions based on this information.
          This application compares numeric biomarker values against reference ranges for informational purposes only and does not diagnose conditions.
        </p>
      </div>
    </div>
  );
};

export default Disclaimer;
