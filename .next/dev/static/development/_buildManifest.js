self.__BUILD_MANIFEST = {
  "/_error": [
    "static/chunks/pages/_error.js"
  ],
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/api/rag/:path*"
      },
      {
        "source": "/api/sql/:path*"
      },
      {
        "source": "/api/combined/:path*"
      },
      {
        "source": "/api/documents/:path*"
      },
      {
        "source": "/api/health"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()