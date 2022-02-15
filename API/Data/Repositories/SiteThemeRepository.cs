﻿using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs.Theme;
using API.Entities;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data.Repositories;

public interface ISiteThemeRepository
{
    void Add(SiteTheme theme);
    void Remove(SiteTheme theme);
    Task<IEnumerable<SiteThemeDto>> GetThemeDtos();
    Task<SiteThemeDto> GetThemeDto(int themeId);
    Task<SiteThemeDto> GetThemeDtoByName(string themeName);
    Task<SiteTheme> GetDefaultTheme();
    Task<IEnumerable<SiteTheme>> GetThemes();
}

public class SiteThemeRepository : ISiteThemeRepository
{
    private readonly DataContext _context;
    private readonly IMapper _mapper;

    public SiteThemeRepository(DataContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public void Add(SiteTheme theme)
    {
        _context.Add(theme);
    }

    public void Remove(SiteTheme theme)
    {
        _context.Remove(theme);
    }

    public async Task<IEnumerable<SiteThemeDto>> GetThemeDtos()
    {
        return await _context.SiteTheme
            .ProjectTo<SiteThemeDto>(_mapper.ConfigurationProvider)
            .ToListAsync();
    }

    public async Task<SiteThemeDto> GetThemeDtoByName(string themeName)
    {
        return await _context.SiteTheme
            .Where(t => t.Name.Equals(themeName))
            .ProjectTo<SiteThemeDto>(_mapper.ConfigurationProvider)
            .SingleOrDefaultAsync();
    }

    public async Task<SiteTheme> GetDefaultTheme()
    {
        return await _context.SiteTheme
            .Where(t => t.IsDefault)
            .SingleOrDefaultAsync();
    }

    public async Task<IEnumerable<SiteTheme>> GetThemes()
    {
        return await _context.SiteTheme
            .ToListAsync();
    }

    public async Task<SiteThemeDto> GetThemeDto(int themeId)
    {
        return await _context.SiteTheme
            .Where(t => t.Id == themeId)
            .ProjectTo<SiteThemeDto>(_mapper.ConfigurationProvider)
            .SingleOrDefaultAsync();
    }
}
