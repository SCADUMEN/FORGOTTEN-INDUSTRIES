#!/usr/bin/env ruby

require "fileutils"
require "date"
require "json"
require "time"
require "yaml"

ROOT = File.expand_path("..", __dir__)
SRC = File.join(ROOT, "src")
DIST = File.join(ROOT, "dist")

SOURCE_FILES = [
  { "label" => "projects", "path" => "src/data/projects.yml" },
  { "label" => "inventory", "path" => "src/data/inventory.yml" },
  { "label" => "fieldLogs", "path" => "src/data/field-logs.yml" },
  { "label" => "voiceLogs", "path" => "src/data/voice-logs.yml" },
  { "label" => "socialPosts", "path" => "src/data/social-posts.yml" }
].freeze

def load_yaml(path)
  YAML.safe_load(
    File.read(path),
    permitted_classes: [Date, Time],
    aliases: false
  )
end

def assert_array!(data, key, path)
  value = data.fetch(key)
  return value if value.is_a?(Array)

  abort("#{path}: expected #{key} to be an array")
end

def assert_unique!(records, key, label)
  values = records.map { |record| record.fetch(key) }
  duplicates = values.group_by(&:itself).select { |_value, group| group.length > 1 }.keys
  return if duplicates.empty?

  abort("#{label}: duplicate #{key} values: #{duplicates.join(", ")}")
end

def compact_text(value)
  case value
  when Array
    value.map { |item| compact_text(item) }.reject(&:empty?).join(" ")
  when Hash
    value.values.map { |item| compact_text(item) }.reject(&:empty?).join(" ")
  when NilClass
    ""
  else
    value.to_s.gsub(/\s+/, " ").strip
  end
end

def normalize_terms(value)
  Array(value).compact.map { |term| term.to_s.downcase.strip }.reject(&:empty?)
end

def slugify(value)
  value.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-+|-+$/, "")
end

def search_document(
  id:,
  type:,
  title:,
  url:,
  date: nil,
  category: nil,
  object: nil,
  system: nil,
  condition: nil,
  status: nil,
  associated_project: nil,
  tags: [],
  project: nil,
  summary: nil,
  body: nil,
  signature: nil,
  source: nil
)
  title_text = compact_text(title)
  summary_text = compact_text(summary)
  body_text = compact_text(body)
  tag_terms = normalize_terms(tags)
  category_text = compact_text(category)
  type_text = compact_text(type)
  object_text = compact_text(object)
  system_text = compact_text(system)
  condition_text = compact_text(condition)
  status_text = compact_text(status)
  associated_project_text = compact_text(associated_project || project)
  signature_text = compact_text(signature)

  {
    "id" => id.to_s,
    "type" => type_text,
    "title" => title_text,
    "url" => url,
    "date" => date&.to_s,
    "category" => category_text,
    "object" => object_text,
    "system" => system_text,
    "condition" => condition_text,
    "status" => status_text,
    "associated_project" => associated_project_text,
    "tags" => tag_terms,
    "project" => project&.to_s,
    "summary" => summary_text,
    "body" => body_text,
    "signature" => signature_text,
    "source" => source,
    "tokens" => [
      id,
      type_text,
      title_text,
      category_text,
      object_text,
      system_text,
      condition_text,
      status,
      associated_project_text,
      tag_terms,
      summary_text,
      body_text,
      signature_text
    ].flatten.compact.join(" ").downcase
  }
end

def post_documents(posts_dir)
  Dir.glob(File.join(posts_dir, "*.md")).sort.map do |path|
    raw = File.read(path)
    next unless raw.start_with?("---\n")

    _opening, front_matter, body = raw.split(/^---\s*$/, 3)
    next unless front_matter && body

    data = YAML.safe_load(front_matter, permitted_classes: [Date, Time], aliases: false) || {}
    basename = File.basename(path, ".md")
    search_document(
      id: data["entry"] || data["slug"] || basename,
      type: data["type"] || "post",
      title: data["title"] || basename,
      url: "/posts/#{basename}.html",
      date: data["date"],
      category: data["category"],
      object: data["object"],
      system: data["system"],
      condition: data["condition"],
      status: data["status"],
      associated_project: data["associated_project"],
      tags: data["tags"],
      summary: data["description"],
      body: body,
      signature: data["signature"],
      source: "src/posts/#{File.basename(path)}"
    )
  end.compact
end

def inventory_tags(item)
  [
    item["tags"],
    item["category"],
    item["manufacturer"],
    item["model"]
  ].flatten.compact
end

projects_path = File.join(ROOT, "src/data/projects.yml")
inventory_path = File.join(ROOT, "src/data/inventory.yml")
field_logs_path = File.join(ROOT, "src/data/field-logs.yml")
voice_logs_path = File.join(ROOT, "src/data/voice-logs.yml")
social_posts_path = File.join(ROOT, "src/data/social-posts.yml")

projects = assert_array!(load_yaml(projects_path), "projects", projects_path)
inventory = assert_array!(load_yaml(inventory_path), "items", inventory_path)
field_logs_data = load_yaml(field_logs_path)
atlas_report_provenance = field_logs_data.fetch("ai_generation")
field_logs = assert_array!(field_logs_data, "field_logs", field_logs_path)
voice_logs = assert_array!(load_yaml(voice_logs_path), "voice_logs", voice_logs_path)
social_posts =
  if File.exist?(social_posts_path)
    assert_array!(load_yaml(social_posts_path), "social_posts", social_posts_path)
  else
    []
  end

assert_unique!(projects, "id", "projects")
assert_unique!(projects, "slug", "projects")
assert_unique!(inventory, "id", "inventory")
assert_unique!(field_logs, "id", "field_logs")
assert_unique!(field_logs, "slug", "field_logs")
assert_unique!(voice_logs, "id", "voice_logs")
assert_unique!(social_posts, "id", "social_posts")
assert_unique!(social_posts, "slug", "social_posts")

project_ids = projects.map { |project| project.fetch("id") }
projects_by_id = projects.to_h { |project| [project.fetch("id"), project] }
(inventory + field_logs).each do |record|
  next if project_ids.include?(record.fetch("associated_project"))

  abort("#{record.fetch("id")}: unknown associated_project #{record.fetch("associated_project")}")
end

archive = {
  "schemaVersion" => "0.1.0",
  "generatedAt" => Time.now.utc.iso8601,
  "meta" => {
    "name" => "Forgotten Industries",
    "type" => "archive / evidence-based memoir / technical blog",
    "tagline" => "An archive and evidence-based memoir that explores what happens to the things we leave behind: old machines, abandoned projects, and the parts of ourselves we once thought lost.",
    "voice" => "intimate, precise, archival, technical, emotionally honest",
    "sourceFiles" => SOURCE_FILES
  },
  "projects" => projects,
  "inventory" => inventory,
  "atlasReportProvenance" => atlas_report_provenance,
  "fieldLogs" => field_logs,
  "voiceLogs" => voice_logs,
  "socialPosts" => social_posts
}

search_documents = []

projects.each do |project|
  search_documents << search_document(
    id: project.fetch("id"),
    type: "project",
    title: project.fetch("title"),
    url: "/archive/projects/#{slugify(project["slug"] || project.fetch("id"))}/",
    date: project["revived"] || project["started"],
    category: project["category"],
    object: project["title"],
    system: project["category"],
    status: project["status"],
    associated_project: project.fetch("id"),
    tags: project["themes"],
    project: project.fetch("id"),
    summary: project["summary"],
    body: project,
    source: "src/data/projects.yml"
  )
end

inventory.each do |item|
  project = projects_by_id[item.fetch("associated_project")]
  search_documents << search_document(
    id: item.fetch("id"),
    type: "inventory",
    title: item["name"] || item.fetch("id"),
    url: "/archive/objects/#{slugify(item.fetch("id"))}/",
    date: item["date"] || item["date_logged"],
    category: item["category"] || item["type"],
    object: item["name"] || item.fetch("id"),
    system: project && project["title"],
    condition: item["condition"],
    status: item["status"],
    associated_project: item["associated_project"],
    tags: inventory_tags(item),
    project: item["associated_project"],
    summary: item["summary"] || item["description"],
    body: item,
    source: "src/data/inventory.yml"
  )
end

field_logs.each do |log|
  search_documents << search_document(
    id: log.fetch("id"),
    type: log["category"] || "field-log",
    title: log.fetch("title"),
    url: "/field-logs/#{log.fetch("slug")}/",
    date: log["date"],
    category: log["category"],
    object: log["object"],
    system: log["system"],
    condition: log["condition"],
    status: log["status"],
    associated_project: log["associated_project"],
    tags: log["tags"],
    project: log["associated_project"],
    summary: log["summary"] || "#{log["object"]}. #{log["status"]}.",
    body: log["sections"] || log,
    signature: log["signature"],
    source: "src/data/field-logs.yml"
  )
end

voice_logs.each do |log|
  search_documents << search_document(
    id: log.fetch("id"),
    type: "voice-field-log",
    title: log.fetch("title"),
    url: "/field-logs/voice/##{log.fetch("id")}",
    date: log["date"],
    category: "field-log",
    object: log["recorder"],
    system: "voice recorder",
    tags: log["tags"],
    summary: log["summary"],
    body: log["transcript"],
    source: "src/data/voice-logs.yml"
  )
end

social_posts.each do |post|
  search_documents << search_document(
    id: post.fetch("id"),
    type: "social-post",
    title: post["title"] || post.fetch("slug"),
    url: post["post_path"] ? "/#{post["post_path"]}" : "/social-posts.html",
    date: post["date"],
    category: post["source"],
    status: post["source"],
    tags: post["tags"],
    summary: post["body"],
    body: post,
    source: "src/data/social-posts.yml"
  )
end

search_documents.concat(post_documents(File.join(SRC, "posts")))

search_index = {
  "schemaVersion" => "0.1.0",
  "generatedAt" => archive.fetch("generatedAt"),
  "archiveState" => Date.today.iso8601,
  "generator" => "L'ARCHIVE Builder",
  "sourceFiles" => SOURCE_FILES.map { |source| source.fetch("path") } + ["src/posts/*.md"],
  "queryLanguage" => {
    "name" => "L'INDEX Query Language",
    "examples" => [
      "title:\"Pang\"",
      "tag:watercooling",
      "type:doctrine",
      "category:\"CaseLabs Archive\"",
      "date>2026-06-01",
      "project:FI-PROJ-001"
    ]
  },
  "documents" => search_documents
}

FileUtils.mkdir_p(DIST)

json = JSON.pretty_generate(archive)
File.write(File.join(DIST, "forgotten-industries.json"), "#{json}\n")
File.write(File.join(DIST, "search-index.json"), "#{JSON.pretty_generate(search_index)}\n")

types = File.read(File.join(SRC, "types.ts")).strip
typescript = <<~TS
  // Generated by scripts/build.rb. Edit src/data/*.yml and src/types.ts, then run npm run build.

  #{types}

  export const archive = #{json} satisfies ForgottenIndustriesArchive;

  export const projects = archive.projects;
  export const inventory = archive.inventory;
  export const fieldLogs = archive.fieldLogs;
  export const voiceLogs = archive.voiceLogs;
  export const socialPosts = archive.socialPosts;

  export default archive;
TS

File.write(File.join(DIST, "index.ts"), typescript)

puts "Wrote dist/forgotten-industries.json"
puts "Wrote dist/search-index.json"
puts "Wrote dist/index.ts"
