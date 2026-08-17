import nextConfig from "eslint-config-next"
import coreWebVitals from "eslint-config-next/core-web-vitals"
import typescript from "eslint-config-next/typescript"

const config = [
  { ignores: ["ios/", "wearos/"] },
  ...nextConfig,
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // React Compiler rules — flag standard patterns (setState in useEffect,
      // Math.random in render, ref reads during render). Enable when the project
      // opts into the React Compiler.
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]

export default config
