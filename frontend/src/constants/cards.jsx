import React from 'react'

export const FILTER_OPTIONS = ['All', 'UGC', 'Music', 'Clipping', 'Logo']

export const FILTER_ICONS = {
  All: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  UGC: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  Music: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  Clipping: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  ),
  Logo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  )
}

export const MOCK_CARDS = [
  { _id: '1', title: 'Product Review', category: 'UGC', letter: 'P', order: 1 },
  { _id: '2', title: 'Unboxing', category: 'UGC', letter: 'U', order: 2 },
  { _id: '3', title: 'Tutorial', category: 'UGC', letter: 'T', order: 3 },
  { _id: '4', title: 'Background Score', category: 'Music', letter: 'B', order: 4 },
  { _id: '5', title: 'Jingle', category: 'Music', letter: 'J', order: 5 },
  { _id: '6', title: 'Podcast Intro', category: 'Music', letter: 'P', order: 6 },
  { _id: '7', title: 'Highlight Reel', category: 'Clipping', letter: 'H', order: 7 },
  { _id: '8', title: 'Short Form', category: 'Clipping', letter: 'S', order: 8 },
  { _id: '9', title: 'Trailer Cut', category: 'Clipping', letter: 'T', order: 9 },
  { _id: '10', title: 'Brand Mark', category: 'Logo', letter: 'B', order: 10 },
  { _id: '11', title: 'Icon Set', category: 'Logo', letter: 'I', order: 11 },
  { _id: '12', title: 'Wordmark', category: 'Logo', letter: 'W', order: 12 }
]

