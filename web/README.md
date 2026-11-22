# Reforge Website

Landing page served at https://reforge.ne2.studio, built by `.github/workflows/web-cicd.yml` and deployed to
Cloudflare Pages (project `reforge-web`; pull requests get a `<branch>.reforge-web.pages.dev` preview).

## :pick: Requirements

- [Hugo](https://gohugo.io/getting-started/installing/)
- [Hugo-Extended (scss extension)](https://gohugo.io/getting-started/installing/#chocolatey-windows)
- Make (For windows install with [choco](https://community.chocolatey.org/packages/make))

## :rocket: Build and Release

## Development server

```sh
make dev
```

## Build for production

```sh
make publish
```
