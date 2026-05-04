# books.apiad.net — site build pipeline
#
# Source repos are siblings under ../books-<slug>/ (private). Each is a Quarto
# project; we render HTML, rsync it into books/<slug>/, then run site-side
# generate (data.js, sitemap, robots.txt) + inject (reader UI into per-chapter
# HTML). The site is the only public-facing artefact.
#
# Common workflows
#   make build          # site-side processing only (generate + inject) — fast
#   make render-mhai    # render one book + copy HTML into books/mhai/
#   make render-all     # render all four books
#   make full-build     # render all books, then site-side build
#   make full-build -j4 # same, parallelised across the four book renders
#
# When source for a book changes, the per-book render reaches into the sibling
# repo; books/ here only ever holds rendered HTML. Source is never copied here.

.PHONY: build inject render-mhai render-chatbots render-graphs render-tsoc render-all full-build

# === Site processing ===

build:
	$(MAKE) -C books build

inject:
	$(MAKE) -C books inject

# === Source rendering ===

render-mhai:
	cd ../books-mhai/english && quarto render --to html
	mkdir -p books/mhai
	rsync -a --delete --exclude='*.pdf' --exclude='*.epub' ../books-mhai/english/_book/ books/mhai/

render-chatbots:
	cd ../books-chatbots/src && quarto render --to html
	mkdir -p books/chatbots
	rsync -a --delete --exclude='*.pdf' --exclude='*.epub' ../books-chatbots/src/_book/ books/chatbots/

render-graphs:
	cd ../books-graphs && python3 snippets.py
	cd ../books-graphs/src && quarto render --to html --profile prod
	mkdir -p books/graphs
	rsync -a --delete --exclude='*.pdf' --exclude='*.epub' ../books-graphs/src/_book/ books/graphs/

render-tsoc:
	cd ../books-tsoc/src && quarto render --to html
	mkdir -p books/tsoc
	rsync -a --delete --exclude='*.pdf' --exclude='*.epub' ../books-tsoc/src/_book/ books/tsoc/

render-all: render-mhai render-chatbots render-graphs render-tsoc

# === Full pipeline ===

full-build: render-all build
