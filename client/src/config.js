export function displayNameForName(name) {
  // this takes off the part before the .gov
  // so as to not display redundant information
  // (since all the site in the original are .gov)
  // with a different dataset, you can just return name
  // or modify accordingly.
  // just be sure to make the corresponding adjustments in
  // nameForDisplayName
  // return name
  return name.split(".")[0]
}

export function nameForDisplayName(displayName) {
  // return displayName
  return `${displayName}.gov`
}

// export const baseUrl = "http://localhost:8000"
export const baseUrl = "https://myfp10.deta.dev"

export const initialNode = "cdc.gov"
