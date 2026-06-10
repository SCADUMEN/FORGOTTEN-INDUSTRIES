#!/usr/bin/env ruby

require "cgi"
require "date"
require "fileutils"
require "json"
require "net/http"
require "rexml/document"
require "time"
require "uri"
require "yaml"

ROOT = File.expand_path("..", __dir__)
ASSET_DIR = File.join(ROOT, "assets/social")
POST_DIR = File.join(ROOT, "src/posts/social")
SRC_FILE = File.join(ROOT, "src/data/social-posts.yml")
SOCIAL_INDEX = File.join(ROOT, "src/social-posts.html")

INSTAGRAM_USER_ID = "1562795348"
INSTAGRAM_USERNAME = "forgottenindustries"
INSTAGRAM_HEADERS = {
  "user-agent" => "Mozilla/5.0",
  "accept" => "application/json,text/html,*/*",
  "x-ig-app-id" => "936619743392459"
}.freeze

class FetchError < StandardError; end

def fetch(url, headers = {}, limit = 8)
  raise FetchError, "too many redirects for #{url}" if limit <= 0

  uri = URI(url)
  response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
    request = Net::HTTP::Get.new(uri)
    headers.each { |key, value| request[key] = value }
    http.request(request)
  end

  case response
  when Net::HTTPSuccess
    response
  when Net::HTTPRedirection
    fetch(URI.join(url, response["location"]).to_s, headers, limit - 1)
  else
    raise FetchError, "#{url}: #{response.code} #{response.message} #{response.body[0, 180]}"
  end
end

def slugify(value)
  value.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-|-$/, "")[0, 72]
end

def ext_from_response(response, fallback)
  content_type = response["content-type"].to_s.split(";").first
  return ".jpg" if content_type == "image/jpeg"
  return ".png" if content_type == "image/png"
  return ".webp" if content_type == "image/webp"
  return ".gif" if content_type == "image/gif"
  return ".mp4" if content_type == "video/mp4"

  fallback
end

def download_media(url, stem, fallback_ext)
  fallback_path = File.join(ASSET_DIR, "#{stem}#{fallback_ext}")
  return "assets/social/#{File.basename(fallback_path)}" if File.exist?(fallback_path)

  response = fetch(url, { "user-agent" => "Mozilla/5.0" })
  ext = ext_from_response(response, fallback_ext)
  path = File.join(ASSET_DIR, "#{stem}#{ext}")
  return "assets/social/#{File.basename(path)}" if File.exist?(path)

  File.binwrite(path, response.body)
  "assets/social/#{File.basename(path)}"
rescue FetchError => error
  warn "media skipped: #{error.message}"
  nil
end

def existing_instagram_media(shortcode, media_kind)
  files = Dir.glob(File.join(ASSET_DIR, "instagram-*#{shortcode}*")).sort
  file =
    case media_kind
    when "video"
      files.find { |path| File.extname(path) == ".mp4" }
    when "poster"
      files.find { |path| File.basename(path).include?("-poster.") && [".jpg", ".png", ".webp"].include?(File.extname(path)) }
    else
      files.find do |path|
        [".jpg", ".png", ".webp"].include?(File.extname(path)) &&
          !File.basename(path).include?("-poster.")
      end
    end

  file ? "assets/social/#{File.basename(file)}" : nil
end

def markdown_escape(text)
  text.to_s.gsub("\r\n", "\n").lines.map(&:rstrip).join.strip
end

def clean_text(text)
  markdown_escape(text)
end

def write_markdown_post(record)
  path = File.join(POST_DIR, "#{record.fetch("date")}-#{record.fetch("slug")}.md")
  media_lines = record.fetch("media").map do |media|
    if media.fetch("type") == "video"
      lines = []
      lines << "![#{record.fetch("title")}](../../#{media.fetch("poster")})" if media["poster"]
      lines << "Video: [#{File.basename(media.fetch("path"))}](../../#{media.fetch("path")})" if media["path"]
      lines.join("\n\n")
    else
      "![#{record.fetch("title")}](../../#{media.fetch("path")})"
    end
  end

  frontmatter = record.reject { |key, _value| key == "body" || key == "media" }
  frontmatter["media"] = record.fetch("media")

  body = <<~MD
    #{frontmatter.to_yaml}---

    #{media_lines.join("\n\n")}

    #{markdown_escape(record["body"])}

    Source: #{record.fetch("source_url")}
  MD

  File.write(path, body)
  "posts/social/#{File.basename(path)}"
end

def tumblr_posts
  body = fetch("https://forgottenindustries.tumblr.com/api/read/json?num=50").body
  json = body.sub(/\Avar tumblr_api_read = /, "").sub(/;\s*\z/, "")
  data = JSON.parse(json)

  data.fetch("posts").map.with_index(1) do |post, index|
    time = Time.parse(post.fetch("date-gmt").sub(" GMT", " UTC"))
    source_id = post.fetch("id")
    source_url = post.fetch("url")
    image_url = post["photo-url-1280"] || post["photo-url-500"]
    caption = post["photo-caption"].to_s.gsub(/<[^>]+>/, "").strip
    slug = "tumblr-#{source_id}"
    media = []

    if image_url && !image_url.empty?
      path = download_media(image_url, slug, ".jpg")
      media << {
        "type" => "image",
        "path" => path,
        "source_url" => image_url,
        "width" => post["width"],
        "height" => post["height"]
      } if path
    end

    {
      "id" => "FI-SOC-TUMBLR-#{index.to_s.rjust(3, "0")}",
      "source" => "tumblr",
      "source_id" => source_id,
      "source_url" => source_url,
      "slug" => slug,
      "title" => "Tumblr Photo #{source_id}",
      "date" => time.utc.strftime("%Y-%m-%d"),
      "timestamp" => time.utc.iso8601,
      "body" => clean_text(caption),
      "tags" => [],
      "media" => media
    }
  end
end

def instagram_page(max_id = nil)
  url = "https://www.instagram.com/api/v1/feed/user/#{INSTAGRAM_USER_ID}/?count=50"
  url = "#{url}&max_id=#{CGI.escape(max_id)}" if max_id
  JSON.parse(fetch(url, INSTAGRAM_HEADERS).body)
end

def best_candidate(candidates)
  candidates.max_by { |candidate| candidate.fetch("width", 0).to_i * candidate.fetch("height", 0).to_i }
end

def instagram_media_for(item, record_slug)
  media = []

  media_items =
    if item["carousel_media"].is_a?(Array)
      item["carousel_media"]
    else
      [item]
    end

  media_items.each_with_index do |entry, index|
    suffix = media_items.length > 1 ? "-#{index + 1}" : ""
    stem = "#{record_slug}#{suffix}"
    media_type = entry["media_type"] || item["media_type"]
    image_versions = entry.dig("image_versions2", "candidates") || item.dig("image_versions2", "candidates") || []
    image_url = best_candidate(image_versions)&.fetch("url", nil) || entry["display_uri"] || item["display_uri"]

    if media_type == 2
      video_url = best_candidate(entry["video_versions"] || item["video_versions"] || [])&.fetch("url", nil)
      poster = image_url ? download_media(image_url, "#{stem}-poster", ".jpg") : nil
      video = video_url ? download_media(video_url, stem, ".mp4") : nil
      media << {
        "type" => "video",
        "path" => video,
        "poster" => poster,
        "source_url" => video_url,
        "poster_source_url" => image_url,
        "width" => entry["original_width"] || item["original_width"],
        "height" => entry["original_height"] || item["original_height"]
      }.compact
    elsif image_url
      path = download_media(image_url, stem, ".jpg")
      if path
        media << {
          "type" => "image",
          "path" => path,
          "source_url" => image_url,
          "width" => entry["original_width"] || item["original_width"],
          "height" => entry["original_height"] || item["original_height"]
        }
      end
    end
  end

  media
end

def instagram_posts
  records = []
  seen = {}
  max_id = nil

  loop do
    page = instagram_page(max_id)
    page.fetch("items", []).each do |item|
      source_id = item.fetch("pk")
      next if seen[source_id]

      seen[source_id] = true
      time = Time.at(item.fetch("taken_at")).utc
      caption = item.dig("caption", "text").to_s.strip
      shortcode = item.fetch("code")
      slug_base = slugify(caption.split("\n").first)
      slug = "instagram-#{time.strftime("%Y%m%d")}-#{shortcode}"
      slug = "#{slug}-#{slug_base}" unless slug_base.empty?
      slug = slug[0, 96].gsub(/-$/, "")

      records << {
        "id" => "FI-SOC-IG-#{records.length.next.to_s.rjust(3, "0")}",
        "source" => "instagram",
        "source_id" => source_id,
        "shortcode" => shortcode,
        "source_url" => "https://www.instagram.com/p/#{shortcode}/",
        "slug" => slug,
        "title" => "Instagram #{shortcode}",
        "date" => time.strftime("%Y-%m-%d"),
        "timestamp" => time.iso8601,
        "body" => caption,
        "tags" => caption.scan(/#[[:alnum:]_]+/).map { |tag| tag.delete_prefix("#") },
        "like_count" => item["like_count"],
        "comment_count" => item["comment_count"],
        "media" => instagram_media_for(item, slug)
      }
    end

    break unless page["more_available"] && page["next_max_id"]
    break if max_id == page["next_max_id"]

    max_id = page["next_max_id"]
  rescue FetchError => error
    warn "instagram pagination stopped: #{error.message}"
    break
  end

  records
end

def existing_posts(source)
  return [] unless File.exist?(SRC_FILE)

  data = YAML.safe_load(
    File.read(SRC_FILE),
    permitted_classes: [Date, Time],
    aliases: false
  )

  data.fetch("social_posts", []).select { |record| record["source"] == source }
rescue Errno::ENOENT, Psych::Exception
  []
end

def instagram_recovery_posts(path)
  data = JSON.parse(File.read(path))

  data.fetch("posts").sort_by { |post| post.fetch("timestamp") }.map.with_index(1) do |post, index|
    time = Time.parse(post.fetch("timestamp"))
    caption = clean_text(post.fetch("caption"))
    shortcode = post.fetch("shortcode")
    slug_base = slugify(caption.split("\n").first)
    slug = "instagram-#{time.utc.strftime("%Y%m%d")}-#{shortcode}"
    slug = "#{slug}-#{slug_base}" unless slug_base.empty?
    slug = slug[0, 96].gsub(/-$/, "")
    media = []

    if post["og_video_url"].to_s != ""
      poster_url = post["profile_image_url"].to_s.empty? ? post["og_image_url"] : post["profile_image_url"]
      poster = existing_instagram_media(shortcode, "poster")
      poster ||= poster_url.to_s.empty? ? nil : download_media(poster_url, "#{slug}-poster", ".jpg")
      video = existing_instagram_media(shortcode, "video")
      video ||= download_media(post.fetch("og_video_url"), slug, ".mp4")
      video_width = post["page_image_width"].to_i >= 300 ? post["page_image_width"] : 640
      video_height = post["page_image_height"].to_i >= 300 ? post["page_image_height"] : 640
      media << {
        "type" => "video",
        "path" => video,
        "poster" => poster,
        "source_url" => post.fetch("og_video_url"),
        "poster_source_url" => poster_url,
        "width" => video_width,
        "height" => video_height
      }.compact
    else
      image_url =
        if !post["profile_image_url"].to_s.empty?
          post["profile_image_url"]
        elsif !post["page_image_url"].to_s.empty?
          post["page_image_url"]
        else
          post["og_image_url"]
        end
      image = existing_instagram_media(shortcode, "image")
      image ||= image_url.to_s.empty? ? nil : download_media(image_url, slug, ".jpg")
      media << {
        "type" => "image",
        "path" => image,
        "source_url" => image_url,
        "width" => post["page_image_width"],
        "height" => post["page_image_height"]
      }.compact if image
    end

    permalink_type = post["kind"] == "reel" ? "reel" : "p"

    record = {
      "id" => "FI-SOC-IG-#{index.to_s.rjust(3, "0")}",
      "source" => "instagram",
      "source_id" => post.fetch("source_id").to_s,
      "shortcode" => shortcode,
      "source_url" => "https://www.instagram.com/#{permalink_type}/#{shortcode}/",
      "slug" => slug,
      "title" => "Instagram #{shortcode}",
      "date" => time.utc.strftime("%Y-%m-%d"),
      "timestamp" => time.utc.iso8601,
      "body" => caption,
      "tags" => caption.scan(/#[[:alnum:]_]+/).map { |tag| tag.delete_prefix("#") },
      "like_count" => post["like_count"],
      "comment_count" => post["comment_count"],
      "media" => media
    }

    record.compact
  end
end

def write_social_index(records)
  items = records.sort_by { |record| record.fetch("timestamp") }.reverse.map do |record|
    media = record.fetch("media").first
    image =
      if media && media["type"] == "video"
        "<img src=\"#{media.fetch("poster")}\" alt=\"#{CGI.escapeHTML(record.fetch("title"))}\" style=\"width: 100%; height: auto; max-width: 640px;\">"
      elsif media
        "<img src=\"#{media.fetch("path")}\" alt=\"#{CGI.escapeHTML(record.fetch("title"))}\" style=\"width: 100%; height: auto; max-width: 640px;\">"
      else
        ""
      end
    body = clean_text(record.fetch("body"))
    body_html = body.empty? ? "" : "<p>#{CGI.escapeHTML(body)}</p>"

    <<~HTML
      <li>
        <h2>#{CGI.escapeHTML(record.fetch("title"))}</h2>
        <p>#{record.fetch("date")} / #{record.fetch("source")} / <a href="#{record.fetch("source_url")}">source</a> / <a href="#{record.fetch("post_path")}">markdown</a></p>
        #{image}
        #{body_html}
      </li>
    HTML
  end

  html = <<~HTML
    <!doctype html>
    <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <title>Social Posts - Forgotten Industries</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="Imported Forgotten Industries Tumblr and Instagram posts.">
    </head>
    <body>
      <img src="assets/forgotten-industries.jpeg" title="Forgotten Industries logo" alt="Forgotten Industries logo, EST MMXIV" style="width: 100%; height: auto; max-width: 1072px;">
      <h1>Social Posts</h1>
      <p><a href="index.html">Home</a></p>
      <p>Imported from forgottenindustries.tumblr.com and instagram.com/forgottenindustries.</p>
      <ul>
    #{items.join("\n")}
      </ul>
    </body>
    </html>
  HTML

  File.write(SOCIAL_INDEX, html)
end

FileUtils.mkdir_p(ASSET_DIR)
FileUtils.mkdir_p(POST_DIR)

instagram_recovery_json = ENV["INSTAGRAM_RECOVERY_JSON"]
records =
  if instagram_recovery_json && !instagram_recovery_json.empty?
    existing_posts("tumblr") + instagram_recovery_posts(instagram_recovery_json)
  else
    tumblr_posts + instagram_posts
  end
records = records.sort_by { |record| [record.fetch("timestamp"), record.fetch("source"), record.fetch("source_id")] }.reverse
records.each do |record|
  record["post_path"] = write_markdown_post(record)
end

File.write(SRC_FILE, { "social_posts" => records }.to_yaml)
write_social_index(records)

puts "Imported #{records.count { |record| record.fetch("source") == "tumblr" }} Tumblr posts"
puts "Imported #{records.count { |record| record.fetch("source") == "instagram" }} Instagram posts"
puts "Wrote src/data/social-posts.yml"
puts "Wrote src/posts/social/*.md"
puts "Wrote src/social-posts.html"
