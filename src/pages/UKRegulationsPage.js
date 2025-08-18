import React from 'react';

const UKRegulationsPage = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">UK Compliance & Food Safety Regulations</h1>
      <p className="mb-6 text-lg">MAKS OS  is built to help restaurants fully comply with the following UK food safety and hygiene laws:</p>

      <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
        <li><strong>Food Safety Act 1990</strong> – Legal requirement to serve safe food.</li>
        <li><strong>Food Hygiene Regulations 2006</strong> – Requires temperature checks, cleanliness, and documentation.</li>
        <li><strong>Hazard Analysis and Critical Control Points (HACCP)</strong> – You must keep accurate records of fridge, freezer, and hot-hold temps daily.</li>
        <li><strong>Food Standards Agency (FSA) Guidelines</strong> – Regular checks and evidence are mandatory for inspections.</li>
        <li><strong>Environmental Health Inspection Readiness</strong> – Maks stores checklists securely for 2 years and is printable for proof.</li>
      </ul>

      <p className="text-md text-gray-800">
        With Maks, your records are auto-generated and timestamped. Staff sign-ins are automatically linked to checks, ensuring responsibility and full traceability.
      </p>

      <p className="mt-6 font-semibold text-green-700">✅ Maks helps you avoid fines, pass inspections, and run a legally compliant kitchen.</p>
    </div>
  );
};

export default UKRegulationsPage;
