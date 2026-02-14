# Implementation Plan: AI-Powered Call Monitoring & Emotion Intelligence System

## Overview

This implementation plan breaks down the development of the call monitoring system into incremental, testable steps. The approach prioritizes core functionality first (upload mode), then adds real-time features, and finally implements the learning and analytics layers. Each task builds on previous work to ensure continuous integration.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - Initialize Next.js project with TypeScript
  - Set up Supabase project and configure environment variables
  - Install core dependencies: fast-check, WebSocket libraries, audio processing libraries
  - Configure ESLint, Prettier, and testing framework (Jest)
  - Create basic project structure: /components, /lib, /api, /types
  - _Requirements: 13.1, 14.1, 15.1_

- [x] 2. Database Schema and Data Layer
  - [x] 2.1 Create Supabase database schema
    - Create tables: calls, conversational_turns, emotional_metrics, suggestions, patterns, turning_points
    - Add indexes for performance
    - Set up foreign key constraints
    - Configure Row Level Security (RLS) policies
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 14.2_
  
  - [x] 2.2 Implement data access layer
    - Create TypeScript interfaces for all data models
    - Implement Supabase client wrapper
    - Create CRUD functions for each table
    - Add query functions with filtering support
    - _Requirements: 5.1, 5.5_
  
  - [ ]* 2.3 Write property test for data persistence
    - **Property 15: Data Persistence Round Trip**
    - **Validates: Requirements 5.1**
  
  - [ ]* 2.4 Write property test for referential integrity
    - **Property 17: Referential Integrity**
    - **Validates: Requirements 5.4**
  
  - [ ]* 2.5 Write property test for query filtering
    - **Property 18: Query Filtering Correctness**
    - **Validates: Requirements 5.5**

- [x] 3. Audio Upload and Processing Pipeline
  - [x] 3.1 Create audio upload component
    - Build file upload UI with drag-and-drop
    - Validate audio file format and size
    - Display upload progress
    - _Requirements: 1.1, 1.5_
  
  - [x] 3.2 Implement audio processing service
    - Create audio chunk processor
    - Implement audio format conversion if needed
    - Add audio quality validation (sample rate check)
    - _Requirements: 1.5, 15.4_
  
  - [ ]* 3.3 Write property test for audio quality
    - **Property 3: Audio Quality Invariant**
    - **Validates: Requirements 1.5**
  
  - [ ]* 3.4 Write unit tests for upload validation
    - Test file size limits
    - Test supported formats
    - Test error messages
    - _Requirements: 15.2_

- [x] 4. Transcription Service Integration
  - [x] 4.1 Implement Deepgram transcription service
    - Set up Deepgram API client
    - Create transcription function for audio chunks
    - Implement speaker diarization
    - Handle API errors and retries
    - _Requirements: 2.1, 2.3, 15.3_
  
  - [x] 4.2 Store transcription results
    - Save transcript segments to database
    - Associate with call ID and timestamp
    - Store confidence scores
    - _Requirements: 5.1, 2.4_
  
  - [ ]* 4.3 Write property test for transcription completeness
    - **Property 5: Transcription Completeness**
    - **Validates: Requirements 2.1**
  
  - [ ]* 4.4 Write property test for speaker identification
    - **Property 6: Speaker Identification**
    - **Validates: Requirements 2.3**

- [ ] 5. Checkpoint - Verify Upload and Transcription
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Emotion Analysis Integration
  - [x] 6.1 Implement Hume AI emotion analyzer
    - Set up Hume AI API client
    - Create emotion analysis function
    - Parse and normalize emotion scores
    - Handle API rate limits and errors
    - _Requirements: 3.1, 3.2, 15.3_
  
  - [x] 6.2 Store emotional metrics
    - Save emotion data to database
    - Associate with call ID and timestamp
    - Track emotional changes over time
    - _Requirements: 5.1, 3.5_
  
  - [ ]* 6.3 Write property test for emotion analysis output
    - **Property 8: Emotion Analysis Output**
    - **Validates: Requirements 3.1**
  
  - [ ]* 6.4 Write property test for emotion metrics completeness
    - **Property 9: Emotion Metrics Completeness**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ]* 6.5 Write property test for emotional time series
    - **Property 10: Emotional Time Series**
    - **Validates: Requirements 3.5**

- [x] 7. Conversation Analysis with Gemini
  - [x] 7.1 Implement Gemini conversation analyzer
    - Set up Gemini API client
    - Create conversation analysis prompts
    - Parse LLM responses into structured data
    - Implement trajectory classification logic
    - _Requirements: 4.1, 4.2_
  
  - [x] 7.2 Implement turning point detection
    - Analyze emotion changes over time
    - Identify significant shifts (>30 point changes)
    - Use LLM to explain turning points
    - Store turning points in database
    - _Requirements: 4.3_
  
  - [x] 7.3 Extract topics and context
    - Use LLM to extract key topics
    - Classify conversation intent
    - Store context data
    - _Requirements: 4.5_
  
  - [ ]* 7.4 Write property test for conversation analysis
    - **Property 11: Conversation Analysis Output**
    - **Validates: Requirements 4.1**
  
  - [ ]* 7.5 Write property test for turning point detection
    - **Property 13: Turning Point Detection**
    - **Validates: Requirements 4.3**

- [ ] 8. Call Processing Orchestration
  - [ ] 8.1 Create call processing orchestrator
    - Coordinate parallel API calls (transcription, emotion, conversation)
    - Handle partial failures gracefully
    - Implement retry logic with exponential backoff
    - _Requirements: 15.3, 15.4_
  
  - [x] 8.2 Implement call summary generation
    - Aggregate all call data
    - Generate summary using LLM
    - Include key topics, emotions, turning points
    - Store summary in database
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [ ]* 8.3 Write property test for summary completeness
    - **Property 24: Summary Generation Completeness**
    - **Validates: Requirements 8.1**
  
  - [ ]* 8.4 Write property test for summary persistence
    - **Property 27: Summary Persistence Round Trip**
    - **Validates: Requirements 8.5**

- [ ] 9. Checkpoint - Verify Complete Processing Pipeline
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Pattern Learning Engine
  - [ ] 10.1 Implement pattern identification
    - Query historical calls from database
    - Cluster calls by emotional patterns
    - Calculate similarity scores
    - Identify success and failure patterns
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [ ] 10.2 Store identified patterns
    - Save patterns to database
    - Include emotional signatures and outcomes
    - Track pattern frequency and success rates
    - _Requirements: 5.1_
  
  - [ ]* 10.3 Write property test for success pattern identification
    - **Property 19: Success Pattern Identification**
    - **Validates: Requirements 6.1**
  
  - [ ]* 10.4 Write property test for failure pattern identification
    - **Property 20: Failure Pattern Identification**
    - **Validates: Requirements 6.2, 6.5**

- [ ] 11. Suggestion Engine
  - [x] 11.1 Implement rule-based suggestion triggers
    - Check emotion thresholds (anger > 60%, etc.)
    - Query similar historical cases
    - Calculate similarity scores
    - _Requirements: 7.1, 7.2_
  
  - [x] 11.2 Implement LLM-based suggestions
    - Create suggestion generation prompts
    - Include historical context in prompts
    - Parse and format suggestions
    - _Requirements: 7.2, 7.3_
  
  - [x] 11.3 Store and track suggestions
    - Save suggestions to database
    - Associate with call ID and timestamp
    - Track whether suggestions were followed
    - _Requirements: 5.1_
  
  - [ ]* 11.4 Write property test for suggestion triggering
    - **Property 21: Suggestion Triggering**
    - **Validates: Requirements 7.1**
  
  - [ ]* 11.5 Write property test for suggestion historical context
    - **Property 22: Suggestion Historical Context**
    - **Validates: Requirements 7.2, 7.3**

- [ ] 12. Agent Dashboard - Call View
  - [ ] 12.1 Create call detail page
    - Display call metadata (agent, customer, duration)
    - Show transcript with speaker labels
    - Display emotion graph over time
    - Highlight turning points
    - _Requirements: 8.1, 8.2_
  
  - [ ] 12.2 Display suggestions panel
    - Show suggestions with reasoning
    - Display historical success rates
    - Link to similar past cases
    - _Requirements: 7.2_
  
  - [ ] 12.3 Implement call summary view
    - Display generated summary
    - Show key topics and outcomes
    - Display agent performance indicators
    - _Requirements: 8.1, 8.3_

- [ ] 13. Agent Dashboard - Analytics Views
  - [x] 13.1 Create overview dashboard
    - Display total calls, success rate, average duration
    - Show call volume trends over time
    - Display average emotional metrics
    - Implement date range filtering
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 13.2 Create emotional trends view
    - Display emotion graphs over time
    - Highlight emotion spikes
    - Show emotional distribution by call type
    - Implement drill-down to specific periods
    - _Requirements: 10.1, 10.2, 10.4, 10.5_
  
  - [ ] 13.3 Create agent performance view
    - Display per-agent metrics
    - Show agent comparison to team average
    - Track agent improvement over time
    - Identify agent patterns
    - _Requirements: 11.1, 11.2, 11.4, 11.5_
  
  - [ ] 13.4 Create patterns and insights view
    - Display common escalation triggers
    - Show successful de-escalation techniques
    - List frequently occurring issues
    - Highlight behavior-outcome correlations
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ]* 13.5 Write property tests for analytics calculations
    - **Property 28: Success Rate Calculation**
    - **Property 29: Emotion Aggregation**
    - **Property 31: Duration Aggregation**
    - **Validates: Requirements 9.1, 9.2, 9.4**
  
  - [ ]* 13.6 Write property test for dashboard filtering
    - **Property 32: Dashboard Filtering**
    - **Validates: Requirements 9.5**

- [ ] 14. Checkpoint - Verify Upload Mode Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Real-Time Audio Capture (Optional Enhancement)
  - [ ] 15.1 Implement Screen Capture API integration
    - Request screen/tab audio capture permission
    - Set up AudioContext and audio processing
    - Extract audio chunks from MediaStream
    - Handle capture errors and fallback
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ] 15.2 Create WebSocket server
    - Set up WebSocket server in Next.js API routes
    - Handle client connections and disconnections
    - Implement message routing by call ID
    - Add connection health checks
    - _Requirements: 1.2_
  
  - [ ] 15.3 Implement real-time audio streaming
    - Send audio chunks via WebSocket
    - Buffer chunks on server side
    - Process chunks as they arrive
    - Handle network interruptions
    - _Requirements: 1.2, 15.3_
  
  - [ ]* 15.4 Write property test for audio streaming
    - **Property 2: Audio Streaming Reliability**
    - **Validates: Requirements 1.2**

- [ ] 16. Real-Time Dashboard Updates (Optional Enhancement)
  - [ ] 16.1 Implement WebSocket client in dashboard
    - Connect to WebSocket server on call start
    - Handle incoming updates (transcript, emotions, suggestions)
    - Update UI in real-time
    - Handle disconnections and reconnections
    - _Requirements: 7.4_
  
  - [ ] 16.2 Create live emotion graph
    - Display emotions updating in real-time
    - Animate graph as new data arrives
    - Highlight current emotion state
    - _Requirements: 3.5_
  
  - [ ] 16.3 Implement live suggestion notifications
    - Display suggestions as they're generated
    - Show notification badges for new suggestions
    - Allow dismissing or marking as followed
    - _Requirements: 7.4_
  
  - [ ]* 16.4 Write property test for suggestion delivery
    - **Property 23: Suggestion Delivery**
    - **Validates: Requirements 7.4**

- [ ] 17. Authentication and Security
  - [ ] 17.1 Implement Supabase authentication
    - Set up email/password authentication
    - Create login and signup pages
    - Implement session management
    - Add protected routes
    - _Requirements: 14.2, 14.4_
  
  - [ ] 17.2 Secure API endpoints
    - Add authentication middleware
    - Validate user permissions
    - Implement rate limiting
    - Sanitize user inputs
    - _Requirements: 14.3, 14.4_
  
  - [ ]* 17.3 Write property test for authentication enforcement
    - **Property 48: Authentication Enforcement**
    - **Validates: Requirements 14.4**
  
  - [ ]* 17.4 Write unit tests for security
    - Test API key protection
    - Test HTTPS enforcement
    - Test input sanitization
    - _Requirements: 14.1, 14.3_

- [ ] 18. Error Handling and Resilience
  - [ ] 18.1 Implement error handling middleware
    - Create error handler for API routes
    - Log errors with context
    - Return user-friendly error messages
    - _Requirements: 15.1, 15.2_
  
  - [ ] 18.2 Add graceful degradation logic
    - Implement degradation level manager
    - Add fallback behaviors for each level
    - Display appropriate UI for degraded modes
    - _Requirements: 1.4, 15.3_
  
  - [ ] 18.3 Implement retry mechanisms
    - Add exponential backoff for API calls
    - Implement circuit breaker pattern
    - Add request queuing for rate limits
    - _Requirements: 15.3, 15.4_
  
  - [ ]* 18.4 Write property tests for error handling
    - **Property 49: Error Logging**
    - **Property 51: Processing Failure Recovery**
    - **Property 52: API Response Validation**
    - **Validates: Requirements 15.1, 15.3, 15.4**

- [ ] 19. UI Polish and User Experience
  - [ ] 19.1 Add loading states
    - Create loading skeletons for all views
    - Add progress indicators for long operations
    - Display processing status messages
    - _Requirements: 15.5_
  
  - [ ] 19.2 Implement error states
    - Create error message components
    - Add retry buttons where appropriate
    - Display helpful error messages
    - _Requirements: 15.2, 15.5_
  
  - [ ] 19.3 Add responsive design
    - Ensure mobile compatibility
    - Test on different screen sizes
    - Optimize for tablet and desktop
    - _Requirements: General UX_
  
  - [ ]* 19.4 Write property test for UI error states
    - **Property 53: UI Error State Display**
    - **Validates: Requirements 15.5**

- [ ] 20. Demo Preparation and Testing
  - [ ] 20.1 Create demo data
    - Record 5-7 sample calls with variety (angry, happy, escalation, resolution)
    - Process and store in database
    - Verify all features work with demo data
    - _Requirements: 13.1_
  
  - [ ] 20.2 End-to-end testing
    - Test complete upload flow
    - Test real-time flow (if implemented)
    - Test all dashboard views
    - Test error scenarios
    - _Requirements: 13.5, 15.3_
  
  - [ ] 20.3 Performance optimization
    - Optimize database queries
    - Add caching where appropriate
    - Minimize API calls
    - Test with concurrent users
    - _Requirements: 13.1, 13.3_
  
  - [ ]* 20.4 Write integration tests
    - Test end-to-end call processing
    - Test dashboard data flow
    - Test authentication flow
    - _Requirements: 13.5_

- [ ] 21. Final Checkpoint - Complete System Verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Core functionality (tasks 1-14) provides a working demo with upload mode
- Real-time features (tasks 15-16) are optional enhancements
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on upload mode first, then add real-time if time permits
