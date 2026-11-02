# Maakt een rustige kaart (_includes/kaart.svg) met enkel de straatlijnen rond de winkel.
# Gegevens: OpenStreetMap via Overpass. Opnieuw uitvoeren als het adres verandert:
#   ruby tools/kaart.rb
require "net/http"
require "json"
require "yaml"

root = File.expand_path("..", __dir__)
k = YAML.load_file(File.join(root, "_data/winkel.yml"))["kaart"]
lat0, lon0 = k["lat"].to_f, k["lon"].to_f

# Zichtbaar gebied in meter, pin op ongeveer 40% van de hoogte (boven het adreskaartje)
W, H = 760, 620
TOP = -0.4 * H
mx = 111_320 * Math.cos(lat0 * Math::PI / 180)
my = 110_574.0
pad = 150
s = lat0 - (H + TOP + pad) / my
n = lat0 + (-TOP + pad) / my
w = lon0 - (W / 2 + pad) / mx
e = lon0 + (W / 2 + pad) / mx

q = <<~Q
  [out:json][timeout:60];
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"](#{s},#{w},#{n},#{e});
  out geom;
Q
uri = URI("https://overpass-api.de/api/interpreter")
req = Net::HTTP::Post.new(uri, "User-Agent" => "degoudenschaar-kaart/1.0")
req.set_form_data("data" => q)
res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, read_timeout: 90) { |h| h.request(req) }
abort "Overpass gaf #{res.code}: #{res.body[0, 300]}" unless res.is_a?(Net::HTTPSuccess)
ways = JSON.parse(res.body)["elements"].select { |el| el["geometry"] }

groot = /^(motorway|trunk|primary|secondary)/
def pad_d(geo, lat0, lon0, mx, my)
  geo.each_with_index.map do |p, i|
    x = ((p["lon"] - lon0) * mx).round(1)
    y = ((lat0 - p["lat"]) * my).round(1)
    "#{i.zero? ? 'M' : 'L'}#{x} #{y}"
  end.join
end
grote = ways.select { |x| x["tags"]["highway"] =~ groot }.map { |x| pad_d(x["geometry"], lat0, lon0, mx, my) }
kleine = ways.reject { |x| x["tags"]["highway"] =~ groot }.map { |x| pad_d(x["geometry"], lat0, lon0, mx, my) }

svg = <<~SVG
  <svg class="kaart" viewBox="#{-W / 2} #{TOP.round} #{W} #{H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path class="k-straat" stroke-width="7" d="#{kleine.join}"/>
      <path class="k-baan" stroke-width="13" d="#{grote.join}"/>
    </g>
    <g class="k-pin" transform="translate(0 0)">
      <ellipse rx="9" ry="3.5" class="k-halo"/>
      <path d="M0 0C-4-12-18-20-18-33a18 18 0 0 1 36 0C18-20 4-12 0 0Z"/>
      <circle cy="-33" r="6.5" fill="#fff"/>
    </g>
  </svg>
SVG
File.write(File.join(root, "_includes/kaart.svg"), svg)
puts "Klaar: #{ways.size} straten, #{svg.bytesize / 1024} KB"
