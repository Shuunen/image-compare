# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Video comparison: load videos on either side, a second slider appears below to play, pause and seek both videos in sync
- Video mode: when a video is loaded the app is renamed Video Compare (nav and page title) and the green accent turns purple
- Video mode: -10s, -1s, -1f, +1f, +1s and +10s buttons on each side move one video alone to line up videos that differ by an intro for example, the shift is kept when seeking and dropped when new videos are loaded
- Videos the browser can't play (mkv with unsupported codecs, ...) are compared frame by frame, a frame is extracted with ffmpeg wasm at each seek, no conversion, with a loader over the side being processed
- Fixed videos with an undecodable video track (e.g. HEVC mkv) showing 0 × 0 and not playing, they now fall back to frame by frame
- Fixed the layout overflowing the app (cut header and buttons) when the video seek row is shown

### Changed

- Add a VS Code colour scheme to tell this project window apart
- Add a `VERSION` file
- Drop the redundant `run_install` option from the CI

## [0.0.1] - 2026-07-12

- Initial release: image comparison tool with draggable slider

[unreleased]: https://github.com/Shuunen/image-compare/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/Shuunen/image-compare/releases/tag/v0.0.1
