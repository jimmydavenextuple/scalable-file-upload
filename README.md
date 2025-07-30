# scalable-file-upload

A scalable file upload system with chunked upload capabilities.

## Components

- **Frontend**: Next.js application in `large-file-upload-ui/`
- **Backend**: Spring Boot application in `large-file-upload-backend/`

## Development

### Frontend
```bash
cd large-file-upload-ui
npm install
npm run dev
npm run lint
```

### Backend
```bash
cd large-file-upload-backend
./gradlew build
./gradlew test
```
