---
name: open-video
description: Manage an Open.Video channel — the self-hosted YouTube alternative where creators own their content, domain, and 100% of revenue. Use when the user asks to upload videos, manage channels, configure playlists, check analytics, set up custom domain hosting, customize channel branding, configure monetization and ads, embed videos, import from YouTube or MRSS, or perform any video platform management task via Open.Video. Trigger phrases include open.video, video channel, video upload, video analytics, video embed, playlist, channel branding, video hosting, custom domain video, monetization, ad breaks, midroll.
metadata:
  author: open-video
  version: '1.1'
  mcp_server_url: https://mcp.open.video/mcp
---

# Open.Video — AI-Powered Video Platform Management

Open.Video lets creators run their own video channel on a custom domain or on open.video — like running your own YouTube. Creators keep 100% of revenue, own their content, and control the viewer experience. This skill teaches you how to use the full Open.Video MCP toolset effectively.

## When to Use This Skill

Use this skill when the user wants to:

- Upload, link, or manage videos on their Open.Video channel
- Create or configure channels (branding, themes, hosting, layout)
- Set up custom domain hosting (CNAME or WordPress)
- View analytics (channel-level or per-video views, revenue)
- Manage playlists (create, update, add/remove videos)
- Generate embed codes for videos or playlists
- Import videos from YouTube or MRSS feeds
- Configure monetization, ad breaks, ads.txt, sellers.json, or Ad Manager
- Manage account settings, payments, or billing
- Check video processing status or public URLs

## Connection & Authentication

Open.Video uses OAuth — no API keys required. When already connected, tools work immediately. If not connected:

1. Call `list_channels` — if it fails with an auth error, the user needs to connect first.
2. **Claude Desktop (Custom Connector):** Direct them to add the Open.Video connector in Settings → Connectors. Authentication happens automatically via the Connectors UI.
3. **Claude Code / mcp-remote / other clients:** Use the `openvideo_register` tool with the user's email to start a magic-link sign-in flow. A browser window will open for them to enter the code from their email.
4. After authentication, call `list_channels` to confirm access.

## Core Workflow Patterns

### First Interaction — Orientation

Always start a session by understanding the user's account:

1. Call `list_channels` to see all channels and their IDs.
2. If the user has multiple channels, ask which one they want to work with.
3. **Never expose numeric channel IDs or video IDs to the user.** Refer to channels and videos by name/title only. String-based `videoContentId` may be shared when needed.

### Uploading Videos

1. **Always call `prepare_local_upload` first** when the user wants to upload a local file. This checks whether the Upload Helper extension is available and tells you how to proceed (extension tool, shell script fallback, or URL-only).
2. If the Upload Helper is not available and the user has a public URL, use `upload_video` with `sourceUrl` instead.
3. For local uploads, the remote server returns a scoped upload token and instructions. The agent should follow the priority order: (1) use the `openvideo_upload_local_video` extension tool if available, (2) execute the generated Python script if shell access is available, (3) ask the user to provide a public URL instead.
4. **Large uploads are batched.** If the Upload Helper returns status `"uploading"`, keep calling `openvideo_continue_upload` until status is `"complete"`. Report progress percentage to the user between each call. Do NOT retry unless you receive an explicit error.
5. After upload, proactively suggest improvements:
   - Recommend relevant tags/keywords based on the title and description.
   - Suggest a fitting category (call `list_video_categories` to get valid options).
   - Offer to generate or upload a custom thumbnail via `upload_video_thumbnail`.
6. Supported formats: MP4, MKV, MOV. Maximum file size: 30 GB.

### Managing Video Metadata

Use `update_video` to change titles, descriptions, tags, categories, and visibility. Before updating:

1. Call `get_video` to see current metadata.
2. Call `list_video_categories` to look up valid category IDs/names.
3. When the user asks to "optimize" a video, proactively suggest keyword-rich titles, descriptions with relevant terms, and appropriate tags based on the content.

### Channel Branding & Theming

For branding changes, always check current state first:

1. Call `get_channel_branding` to see the full current configuration (colors, fonts, nav items, layout sections, images).
2. Call `get_channel_images` for a quick check on which images exist.
3. Use the appropriate tool for the change:
   - `update_channel_theme` — colors, fonts, template preset
   - `update_channel_navigation` — nav menu links (replaces all items; include existing ones you want to keep)
   - `upload_channel_image` — logo (256×256), nav logo (~400×100 transparent), banner, modern banner, player watermark
   - `update_channel_layout` — homepage sections and order (replaces all; include existing sections)
   - `update_channel_info` — name, description, visibility (public/private/password_protected). For password-protected channels, you must also provide a password.

### Custom Domain Hosting

Open.Video supports three hosting modes:

| Mode | Description | Tool |
|------|-------------|------|
| **open.video** | Default — channel lives at `open.video/@slug` | `update_channel_url` |
| **CNAME** | Custom domain via DNS CNAME record | `setup_cname_hosting` → `verify_cname_hosting` |
| **WordPress** | Custom domain via WordPress plugin | `setup_wordpress_hosting` |

Workflow for CNAME setup:
1. Call `get_channel_hosting` to see current state.
2. Call `setup_cname_hosting` with the desired domain.
3. Provide the user with the DNS records to add.
4. After they confirm DNS is set, call `verify_cname_hosting`.
5. If it returns `waiting_for_certificates`, SSL is provisioning (~20 min). Check again later.

Workflow for WordPress setup:
1. Optionally call `detect_wordpress_domain` to confirm the domain runs WordPress.
2. Call `setup_wordpress_hosting` with the domain and path.
3. Guide the user through WordPress plugin installation.

### Playlists

- `list_playlists` — see all playlists on a channel
- `create_playlist` — new playlist with a name
- `update_playlist` — rename a playlist
- `add_video_to_playlist` / `remove_video_from_playlist` — manage playlist contents
- `get_playlist_embed_code` — generate an embeddable player for a playlist

### Analytics

- `get_channel_analytics` — daily views or revenue for a channel over a date range
- `get_video_analytics` — plays and revenue for a specific video (defaults to last 30 days)
- To check video processing/publish status, use `get_video` — there is no separate status tool.

When presenting analytics, format numbers clearly and offer to compare time periods or identify top-performing content.

### Embed Codes

- `get_video_embed_code` — returns a `<script>` snippet for embedding a single video
- `get_playlist_embed_code` — returns a `<script>` snippet for embedding a playlist player
- `get_video_url` — returns the public watch URL (respects custom domain config)

### YouTube Import

To import existing YouTube content:

1. Call `list_youtube_channels` to see linked YouTube channels.
2. If none linked, call `link_youtube_channel` to start Google OAuth for linking.
3. Once linked, auto-import brings YouTube videos into the Open.Video channel.

MRSS feed import is also available via `import_mrss_feed` for channels approved for monetization.

### Monetization & Ads

Monetization setup depends on the hosting type. **Channels hosted on open.video need no additional setup** — Open.Video handles ads.txt and ad serving automatically. **Custom domain channels (CNAME or WordPress)** must complete a multi-step process. Always start with `get_monetization_overview` to see the current state.

1. **Overview**: `get_monetization_overview` — comprehensive status showing hosting type, ads.txt setup, Google Ad Manager MCM connection, domain approval, sellers.json, and ad toggles. Use this as the starting point for any monetization question.

2. **Ad Configuration**: `get_ad_config` / `update_ad_config` — three toggles:
   - `isEnabled` — master switch to enable/disable all ads
   - `videoAds` — enable/disable video ads (pre-roll and post-roll)
   - `displayAds` — enable/disable display/banner ads
   - Note: Ad config may be locked pending Open.Video approval for new channels.

3. **Ad Breaks (Midrolls)**:
   - `get_video_ad_breaks` — see current midroll placements for a video
   - `set_video_ad_breaks` — set break times in seconds (use 0 for pre-roll). Set `setAsDefault: true` to also save as channel defaults for all videos.
   - `remove_video_ad_breaks` — clear all custom breaks for a video
   - Tip: Place midrolls at natural content breaks. For a 10-minute video, consider breaks around 3:00 and 7:00. Use `get_video` to check `durationMs` for the video length.

4. **Ads.txt (Custom Domains Only)**:
   Ads.txt (Authorized Digital Sellers) tells ad exchanges which partners are authorized to sell inventory on the publisher's domain. Only needed for custom domain hosting.
   - `get_ads_txt_status` — check current validation status with actionable next steps
   - `get_ads_txt_entries` — get the required Open.Video entries for manual copy-paste into an existing ads.txt file
   - `get_ads_txt_setup_instructions` — get personalized setup instructions including server-specific redirect snippets (Apache, Nginx, Vercel, Netlify, WordPress plugin)
   - Three setup options:
     - **Copy entries** (`get_ads_txt_entries`): Manual — publisher adds entries to their own ads.txt file. They must manually update when new demand partners are added.
     - **Auto setup** (`setup_ads_txt_auto`, recommended): Creates a managed Ads.txt Manager account under Open.Video's shared master account. Open.Video automatically pushes new entries. Publisher must set up a 301 redirect from `/ads.txt` to the provided URL.
     - **Manual setup** (`setup_ads_txt_manual`): Like auto, but with the publisher's own dedicated Ads.txt Manager account ID.
   - `recheck_ads_txt` — re-validate after the publisher has set up their redirect or added entries
   - `validate_ads_txt` — detailed validation showing specific missing entries and format errors

5. **Google Ad Manager**: `get_ad_manager_status` / `invite_ad_manager` — manage the MCM (Multiple Customer Management) connection. The MCM step only becomes available after Open.Video reviews and approves the publisher's site. Google typically reviews invitations within a few business days.

6. **Sellers.json**: `get_sellers_json` / `update_sellers_json` — configure supply chain identity (display name and confidentiality setting). Optional but recommended for transparency.

**Custom domain monetization workflow:**
1. Set up ads.txt → 2. Google Ad Manager MCM invite → 3. Google reviews and approves domain → 4. Ads can serve

### Payments

- `get_payment_history` — earnings, amounts owed, historical payments
- `get_payment_details` — breakdown of a specific payment by ledger ID
- `update_payment_threshold` — set minimum payout (minimum $20)
- For payment method, tax info, or bank details → direct user to https://app.open.video

### Account Management

- `get_account` — current user info (name, email, company, channels)
- `update_account_info` — update profile info
- `update_account_email` — initiate email change (sends verification)
- `check_tos_status` / `agree_to_tos` — Terms of Service status and agreement

**Important**: Before calling `agree_to_tos`, you MUST share the Terms of Service URL (https://open.video/terms) and Privacy Policy URL (https://open.video/privacy) with the user and confirm they have reviewed them.

### Upload Helper Extension

The **Upload Helper** is a lightweight companion MCP server that handles local file uploads. It runs alongside the remote Open.Video MCP and only activates when a local file upload is needed.

- **When needed:** Only for uploading local files (videos, thumbnails, channel images). URL uploads (`sourceUrl`) bypass it entirely.
- **How it works:** The remote server generates a scoped upload token and returns it to the agent. The agent passes the token to the Upload Helper, which reads the local file and uploads it using chunked multipart requests.
- **Three upload tools:** `openvideo_upload_local_video` (starts a video upload, returns progress for large files), `openvideo_continue_upload` (continues a batched upload until complete), `openvideo_upload_local_image` (uploads thumbnails and channel images).
- **Installation:** Claude Desktop users can install as an extension from `https://mcp.open.video/extension` (double-click to install). Cursor, Windsurf, and Claude Code users can use the Python script fallback that the remote server generates — no extension needed.
- **Version checks:** The helper checks for updates on first use and warns if outdated. If below the minimum supported version, it blocks until updated.

## Tool Quick Reference

### Read-Only Tools (safe, no side effects)
`list_channels`, `list_videos`, `get_video`, `list_video_categories`, `get_channel_analytics`, `get_video_analytics`, `list_playlists`, `get_video_embed_code`, `get_playlist_embed_code`, `get_video_url`, `get_channel_branding`, `get_channel_images`, `get_channel_hosting`, `get_channel_info`, `detect_wordpress_domain`, `list_youtube_channels`, `get_monetization_overview`, `get_ad_config`, `get_ad_manager_status`, `get_sellers_json`, `get_ads_txt_status`, `get_ads_txt_entries`, `get_ads_txt_setup_instructions`, `get_video_ad_breaks`, `get_account`, `get_payment_history`, `get_payment_details`, `check_tos_status`, `prepare_local_upload`

### Write Tools (modify data — confirm intent before calling)
`upload_video`, `upload_video_thumbnail`, `update_video`, `delete_video`, `create_playlist`, `update_playlist`, `add_video_to_playlist`, `remove_video_from_playlist`, `create_channel`, `update_channel_url`, `update_channel_theme`, `update_channel_navigation`, `upload_channel_image`, `delete_channel_image`, `update_channel_layout`, `update_channel_info`, `update_channel_branding`, `setup_cname_hosting`, `verify_cname_hosting`, `setup_wordpress_hosting`, `update_cname_subdomain`, `update_wordpress_hosting_path`, `link_youtube_channel`, `import_mrss_feed`, `update_ad_config`, `set_video_ad_breaks`, `remove_video_ad_breaks`, `invite_ad_manager`, `update_sellers_json`, `setup_ads_txt_auto`, `setup_ads_txt_manual`, `recheck_ads_txt`, `validate_ads_txt`, `update_account_info`, `update_account_email`, `update_payment_threshold`, `agree_to_tos`, `openvideo_logout`

### Auth Tools (connection management)
`openvideo_register` (magic-link sign-in for Claude Code / mcp-remote clients)

## Best Practices

1. **Check before changing.** Always call the corresponding `get_*` or `list_*` tool before any update to understand current state.
2. **Confirm destructive actions.** Before `delete_video`, `delete_channel_image`, or `remove_video_ad_breaks`, confirm with the user.
3. **Never display numeric IDs.** Refer to channels by name and videos by title. Use IDs only in tool calls.
4. **Be proactive with suggestions.** After uploads, suggest tags, categories, thumbnails, and SEO-friendly descriptions. After viewing analytics, highlight trends and recommend actions.
5. **Batch operations.** When the user wants to update multiple videos (e.g., "add tags to all my videos"), iterate through `list_videos` results and call `update_video` for each.
6. **Respect navigation/layout replacement behavior.** `update_channel_navigation` and `update_channel_layout` replace all items. Always fetch current state first and include items the user wants to keep.
7. **Guide new users through onboarding.** For new channels: create channel → set branding → upload first video → configure hosting → set up monetization.
