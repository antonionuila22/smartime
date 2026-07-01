declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: string
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: string
      NEXT_PUBLIC_SERVER_URL: string
      NEXT_PUBLIC_WHATSAPP_NUMBER: string
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: string
      NEXT_PUBLIC_PAYPAL_ENVIRONMENT: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
