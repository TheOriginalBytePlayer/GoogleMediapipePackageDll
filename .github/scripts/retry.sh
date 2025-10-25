#!/bin/bash
# Portable retry helper script for CI automation with configurable retries and exponential backoff
# Usage: source this script, then call: retry <command>
# Configure max attempts via RETRY_MAX environment variable (default: 3)

set -e

# Default configuration
RETRY_MAX="${RETRY_MAX:-3}"
RETRY_LOG_DIR="${RETRY_LOG_DIR:-/tmp/retry_logs}"

# Create log directory
mkdir -p "${RETRY_LOG_DIR}"

# Color codes for output (if supported)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

# Function: retry
# Retries a command with exponential backoff and jitter
# Arguments: command to retry
# Returns: exit code of the command (0 on success, non-zero on failure)
retry() {
    local attempt=1
    local exit_code=0
    local cmd="$*"
    local log_file="${RETRY_LOG_DIR}/retry_$(date +%s)_$$.log"
    
    echo -e "${YELLOW}[RETRY]${NC} Executing: ${cmd}"
    
    while [ ${attempt} -le ${RETRY_MAX} ]; do
        echo -e "${YELLOW}[RETRY]${NC} Attempt ${attempt}/${RETRY_MAX}"
        
        # Execute command and capture output
        set +e
        eval "${cmd}" 2>&1 | tee "${log_file}"
        exit_code=${PIPESTATUS[0]}
        set -e
        
        if [ ${exit_code} -eq 0 ]; then
            echo -e "${GREEN}[RETRY]${NC} Command succeeded on attempt ${attempt}"
            rm -f "${log_file}"
            return 0
        else
            echo -e "${RED}[RETRY]${NC} Command failed with exit code ${exit_code} on attempt ${attempt}"
            
            if [ ${attempt} -lt ${RETRY_MAX} ]; then
                # Calculate backoff time: base_delay * (2 ^ attempt) + random jitter
                local base_delay=2
                local max_delay=60
                local backoff=$((base_delay * (2 ** (attempt - 1))))
                
                # Add jitter (0-50% of backoff time)
                local jitter=$((RANDOM % (backoff / 2 + 1)))
                local delay=$((backoff + jitter))
                
                # Cap at max_delay
                if [ ${delay} -gt ${max_delay} ]; then
                    delay=${max_delay}
                fi
                
                echo -e "${YELLOW}[RETRY]${NC} Waiting ${delay} seconds before retry..."
                sleep ${delay}
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}[RETRY]${NC} Command failed after ${RETRY_MAX} attempts"
    log_head_errors "${log_file}"
    save_log_artifact "${log_file}"
    
    return ${exit_code}
}

# Function: log_head_errors
# Extracts and displays the top error lines from a log file
# Arguments: log file path
log_head_errors() {
    local log_file="$1"
    
    if [ ! -f "${log_file}" ]; then
        echo -e "${YELLOW}[RETRY]${NC} No log file found at ${log_file}"
        return
    fi
    
    echo -e "${RED}[RETRY]${NC} Top errors from log:"
    echo "----------------------------------------"
    
    # Extract lines containing common error indicators
    if grep -iE "error|failed|fatal|exception|cannot|unable" "${log_file}" | head -20; then
        :
    else
        echo "No specific errors found, showing last 20 lines:"
        tail -20 "${log_file}"
    fi
    
    echo "----------------------------------------"
}

# Function: save_log_artifact
# Saves log file for CI artifact upload
# Arguments: log file path
save_log_artifact() {
    local log_file="$1"
    local artifact_dir="${RETRY_LOG_DIR}/artifacts"
    
    if [ ! -f "${log_file}" ]; then
        echo -e "${YELLOW}[RETRY]${NC} No log file to save as artifact"
        return
    fi
    
    mkdir -p "${artifact_dir}"
    cp "${log_file}" "${artifact_dir}/"
    echo -e "${YELLOW}[RETRY]${NC} Log saved to artifact directory: ${artifact_dir}/"
}

# Export functions for use in subshells
export -f retry
export -f log_head_errors
export -f save_log_artifact

echo -e "${GREEN}[RETRY]${NC} Retry helper loaded (max attempts: ${RETRY_MAX})"
