#!/usr/bin/env python
# coding: utf-8

import argparse
import ffmpeg
import os
import sys
import logging
import ffmpeg

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def list_files(rootDir, suffix):
    files = []
    for dirName, subdirList, fileList in os.walk(rootDir):
        for fname in fileList:
            if fname.lower().endswith(suffix):
                files.append(os.path.join(dirName, fname))

    return files


def run(infile, outfile):
    if not os.path.exists(infile):
        logger.error("%s not exist.", infile)

    out_basedir = os.path.dirname(outfile)

    if not os.path.exists(out_basedir):
        os.makedirs(out_basedir)

    stream = (
        ffmpeg.input(infile)
        .output(outfile,
                y='',
                vcodec='libx264', preset='medium', profile='high', s='1280x720', max_muxing_queue_size='1000',
                maxrate='650K', crf='23', bufsize='1M',
                acodec='libfdk_aac', ac='2', ar='44100', ab='64k')
    )
    logger.info("Run ffmpeg {}".format(
        [e.decode('utf-8') for e in stream.get_args()]
    ))
    stream.run()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Ffmpeg Helper.')
    parser.add_argument('-i', dest='inPath', required=True,
                        help='input Path to scan the movies files.')
    parser.add_argument('-o', dest='outPath', required=True,
                        help='output Path to store the converted files.')
    parser.add_argument('-t', dest='type', default="mp4",
                        help='type of the converted movies, default: mp4.')

    args = parser.parse_args()

    inp = os.path.abspath(args.inPath)
    outp = os.path.abspath(args.outPath)
    print "input path: {} output path: {}".format(inp, outp)
    if inp == outp:
        print("input path and output path can not be equal.")
        sys.exit(-1)
    if os.path.isfile(inp):
        input_path = inp
        filename = os.path.basename(input_path)
        parts = filename.lower().split('.')
        parts[-1] = args.type
        filename = '.'.join(parts)
        output_path = os.path.join(outp, filename)
        logger.info("convert to: %s", output_path)
        run(input_path, output_path)
    else:
        files = list_files(inp, args.type)
        d_len = len(inp)
        for input_path in files:
            output_path = os.path.join(outp, input_path[d_len + 1:])
            filename = os.path.basename(output_path)
            filedir = os.path.dirname(output_path)
            filename = os.path.basename(output_path)

            parts = filename.lower().split('.')
            parts[-1] = args.type
            filename = '.'.join(parts)
            output_path = os.path.join(outp, filename)

            logger.info("convert to: %s", output_path)
            run(input_path, output_path)
